import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Textarea from 'react-textarea-autosize';
import { is } from 'immutable';
import emojify from '../../../features/emoji/emoji';
import escapeTextContentForBrowser from 'escape-html';

const messages = defineMessages({
  placeholder: { id: 'account_note.placeholder', defaultMessage: 'Click to add a note' },
});

class InlineAlert extends React.PureComponent {

  static propTypes = {
    show: PropTypes.bool,
  };

  state = {
    mountMessage: false,
  };

  static TRANSITION_DELAY = 200;

  componentWillReceiveProps (nextProps) {
    if (!this.props.show && nextProps.show) {
      this.setState({ mountMessage: true });
    } else if (this.props.show && !nextProps.show) {
      setTimeout(() => this.setState({ mountMessage: false }), InlineAlert.TRANSITION_DELAY);
    }
  }

  render () {
    const { show } = this.props;
    const { mountMessage } = this.state;

    return (
      <span aria-live='polite' role='status' className='inline-alert' style={{ opacity: show ? 1 : 0 }}>
        {mountMessage && <FormattedMessage id='generic.saved' defaultMessage='Saved' />}
      </span>
    );
  }

}

export default @injectIntl
class AccountNote extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    value: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  state = {
    value: null,
    saving: false,
    saved: false,
    editable: false
  };

  constructor (props) {
    super(props);
    this.setEditable = this.setEditable.bind(this);
    this.unEditable = this.unEditable.bind(this);
  }

  componentWillMount () {
    this._reset();
  }

  componentWillReceiveProps (nextProps) {
    const accountWillChange = !is(this.props.account, nextProps.account);
    const newState = {};

    if (accountWillChange && this._isDirty()) {
      this._save(false);
    }

    if (accountWillChange || nextProps.value === this.state.value) {
      newState.saving = false;
    }

    if (this.props.value !== nextProps.value) {
      newState.value = nextProps.value;
    }
    newState.editable = false;
    this.setState(newState);
  }

  componentWillUnmount () {
    if (this._isDirty()) {
      this._save(false);
    }
  }

  setTextareaRef = c => {
    this.textarea = c;
  }

  setEditable () {
    this.setState({ editable: true });
    this.textarea.focus();
  }
  unEditable () {
    this.setState({ editable: false });
  }

  handleChange = e => {
    this.setState({ value: e.target.value, saving: false });
  };

  handleKeyDown = e => {
    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();

      this._save();

      if (this.textarea) {
        this.textarea.blur();
      }
    } else if (e.keyCode === 27) {
      e.preventDefault();

      this._reset(() => {
        if (this.textarea) {
          this.textarea.blur();
        }
      });
    }
  }

  handleBlur = () => {
    if (this._isDirty()) {
      this._save();
    }
    this.unEditable();
  }

  _save (showMessage = true) {
    this.setState({ saving: true }, () => this.props.onSave(this.state.value));

    if (showMessage) {
      this.setState({ saved: true }, () => setTimeout(() => this.setState({ saved: false }), 2000));
    }
  }

  _reset (callback) {
    this.setState({ value: this.props.value }, callback);
  }

  _isDirty () {
    return !this.state.saving && this.props.value !== null && this.state.value !== null && this.state.value !== this.props.value;
  }

  render () {
    const { account, intl } = this.props;
    const { value, saved, editable } = this.state;
    let emojifiedValue = emojify(escapeTextContentForBrowser(value), []).replace(/\r?\n/g,'<br />');
    if(!value) {
      emojifiedValue = intl.formatMessage(messages.placeholder);
    }

    if (!account) {
      return null;
    }

    return (
      <div className='account__header__account-note'>
        <label htmlFor={`account-note-${account.get('id')}`}>
          <FormattedMessage id='account.account_note_header' defaultMessage='Note' /> <InlineAlert show={saved} />
        </label>
        <Textarea
           id={`account-note-${account.get('id')}`}
           className='account__header__account-note__content'
           disabled={this.props.value === null || value === null}
           placeholder={intl.formatMessage(messages.placeholder)}
           value={value || ''}
           onChange={this.handleChange}
           onKeyDown={this.handleKeyDown}
           onBlur={this.handleBlur}
           ref={this.setTextareaRef}
           style={{ display: editable ? 'block' : 'none' }}
         />
         <div className='account__header__account-note__show' onClick={this.setEditable}
          dangerouslySetInnerHTML={{ __html: emojifiedValue }}
          style={{ display: editable ? 'none' : 'block' }}
         >
        </div> 
      </div>
    );
  }

}
