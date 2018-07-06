import * as React from 'react';
import * as PropTypes from 'prop-types';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';

import {ReduxState, ConnectProps} from '../models';
import {bind, assertSuccess, parseContent} from '../util';
import FileSelector from './FileSelector';

class Root extends React.Component<{viewConfig: any} & React.Props<any> & ConnectProps, {uploadResult?: string}> {
  constructor(props) {
    super(props);
    this.state = {uploadResult: ''};
  }
  componentWillMount() {
    fetch('/files')
    .then(response => response.json())
    .then(files => {
      this.props.dispatch({type: 'ADD_FILES', files});
    });
    // TODO: handle errors
  }
  @bind
  onFileChange(ev: React.FormEvent) {
    const el = ev.target as HTMLInputElement;
    // const files = el.multiple ? el.files : el.files[0];
    const body = new FormData();
    Array.from(el.files).forEach(file => {
      body.append('file', file);
    });
    // send to /upload endpoint
    fetch('/upload', {method: 'PUT', body})
    .then(parseContent)
    .then(assertSuccess)
    .then(response => {
      const {files} = response.content as {files: {name: string}[]};
      this.props.dispatch({type: 'ADD_FILES', files});
      const [file] = files;
      browserHistory.push(`/${file.name}`);
      return `Uploaded ${files.length} file${files.length > 1 ? 's' : ''}: ${files.map(({name}) => name).join(', ')}`;
    }, response => {
      const {error} = response.content as {error: string};
      return `Error: ${error}`;
    })
    .then(uploadResult => {
      this.setState({uploadResult});
      setTimeout(() => {
        const form = this.refs['form'] as HTMLFormElement;
        form.reset();
        this.setState({uploadResult: ''});
      }, 3000);
    });
  }
  render() {
    const {children, viewConfig} = this.props;
    const {uploadResult} = this.state;
    const app_className = [
      ...(viewConfig.outlines ? ['viewConfig-outlines'] : []),
      ...(viewConfig.labels ? ['viewConfig-labels'] : []),
    ].join(' ');

    return (
      <div className={app_className}>
        <header>
          <nav>
            <span>
              <b>Load PDF: </b>
              <FileSelector />
            </span>
            <span>
              <b>Add PDF: </b>
              <form ref="form">
                <input type="file" onChange={this.onFileChange} />
              </form>
              <i>{uploadResult}</i>
            </span>
          </nav>
        </header>
        {children}
      </div>
    );
  }
  static propTypes: React.ValidationMap<any> = {
    viewConfig: PropTypes.object.isRequired,
    children: PropTypes.node,
  };
}

const mapStateToProps = ({viewConfig}: ReduxState) => ({viewConfig});
const ConnectedRoot = connect(mapStateToProps)(Root);

export default ConnectedRoot;
