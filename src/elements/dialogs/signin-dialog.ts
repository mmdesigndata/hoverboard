import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior';
import { html, PolymerElement } from '@polymer/polymer';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';
import { ReduxMixin } from '../../mixins/redux-mixin';
import { RootState } from '../../store';
import { closeDialog, openDialog } from '../../store/dialogs/actions';
import { DIALOGS } from '../../store/dialogs/types';
import { getProviderCompanyName } from '../../store/helpers/actions';
import { mergeAccounts, signIn } from '../../store/user/actions';
import { isDialogOpen } from '../../utils/dialogs';
import '../hoverboard-icons';
import '../shared-styles';

class SigninDialog extends ReduxMixin(mixinBehaviors([IronOverlayBehavior], PolymerElement)) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          margin: 0 auto;
          display: block;
          padding: 24px 32px;
          background: var(--primary-background-color);
          box-shadow: var(--box-shadow);
        }

        .dialog-content {
          margin: 0 auto;
        }

        .sign-in-button {
          margin: 16px 0;
          display: block;
          color: var(--primary-text-color);
        }

        .merge-content .subtitle,
        .merge-content .explanation {
          margin-bottom: 16px;
        }

        .icon-twitter {
          color: var(--twitter-color);
        }

        .icon-facebook {
          color: var(--facebook-color);
        }
      </style>

      <div class="dialog-content">
        <div class="initial-signin" hidden$="[[isMergeState]]">
          {% for provider in signInProviders.providersData %}
          <paper-button
            class="sign-in-button"
            on-click="_signIn"
            provider-url="{$ provider.url $}"
            ga-on="click"
            ga-event-category="attendees"
            ga-event-action="sign-in"
            ga-event-label="signIn dialog - {$ provider.name $}"
            flex
          >
            <iron-icon
              class="icon-{$ provider.name $}"
              icon="hoverboard:{$ provider.name $}"
            ></iron-icon>
            <span provider-url="{$ provider.url $}">{$ provider.label $}</span>
          </paper-button>
          {% endfor %}
        </div>
        <div class="merge-content" hidden$="[[!isMergeState]]">
          <h3 class="subtitle">{$ signInDialog.alreadyHaveAccount $}</h3>
          <div class="explanation">
            <div class="row-1">{$ signInDialog.alreadyUsed $} <b>[[email]]</b>.</div>
            <div class="row-2">
              {$ signInDialog.signInToContinue.part1 $} [[providerCompanyName]] {$
              signInDialog.signInToContinue.part2 $}
            </div>
          </div>

          <div class="action-button" layout horizontal end-justified>
            <paper-button
              class="merge-button"
              on-click="_mergeAccounts"
              ga-on="click"
              ga-event-category="attendees"
              ga-event-action="merge account"
              ga-event-label$="signIn merge account dialog -[[providerCompanyName]]"
              primary
            >
              <span>{$ signInDialog.signInToContinue.part1 $} [[providerCompanyName]]</span>
            </paper-button>
          </div>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'signin-dialog';
  }

  static get properties() {
    return {
      user: {
        type: Object,
      },
      isMergeState: {
        type: Boolean,
        value: false,
      },
      isDialogOpen: {
        type: Boolean,
        value: false,
      },
      email: String,
      providerCompanyName: String,
    };
  }

  stateChanged(state: RootState) {
    this.setProperties({
      user: state.user,
      isDialogOpen: isDialogOpen(state.dialogs, DIALOGS.SIGNIN),
    });
  }

  constructor() {
    super();
    this.addEventListener('iron-overlay-canceled', this._close);
  }

  static get observers() {
    return ['_userChanged(user)'];
  }

  _userChanged(user) {
    if (this.isDialogOpen) {
      closeDialog();
    }
    if (!user.signedIn) {
      if (user.initialProviderId && user.pendingCredential) {
        this.isMergeState = true;
        this.email = user.email;
        this.providerCompanyName = getProviderCompanyName(user.initialProviderId);
        openDialog(DIALOGS.SIGNIN);
      }
    }
  }

  _mergeAccounts() {
    mergeAccounts(this.user.initialProviderId, this.user.pendingCredential);
    closeDialog();
    this.isMergeState = false;
  }

  _close() {
    this.isMergeState = false;
    closeDialog();
  }

  _signIn(event) {
    const providerUrl = event.target.getAttribute('provider-url');
    signIn(providerUrl);
  }
}

window.customElements.define(SigninDialog.is, SigninDialog);
