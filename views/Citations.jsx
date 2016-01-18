import React from 'react';
import {connect} from 'react-redux';
import {linkPaper, citeRegExp} from 'academia/styles/acl';

import {AuthorPropTypes, ReferencePropTypes} from '../propTypes';
import Author from '../components/Author';

const ReferenceRow = ({authors, year, title, index}) => {
  return (
    <tr>
      <td><i>{index}</i></td>
      <td></td>
      <td className="list">
        {authors.map((author, index) => <Author key={index} {...author} />)}
      </td>
      <td>{year}</td>
      <td>{title}</td>
    </tr>
  );
};
ReferenceRow.propTypes = ReferencePropTypes;

const CitationRow = ({reference, authors, year, index}) => (
  <tr>
    <td><i>{index}</i></td>
    <td className="list">
      {authors.map((author, index) => <Author key={index} {...author} />)}
    </td>
    <td>{year}</td>
    {reference ?
      <td>
        <span className="list">
          {reference.authors.map((author, index) => <Author key={index} {...author} />)}
        </span>{'. '}
        {reference.year}{'. '}
        <b>{reference.title}</b>.
      </td> :
      <td><i>no reference</i></td>
    }
  </tr>
);
CitationRow.propTypes = {
  authors: React.PropTypes.arrayOf(React.PropTypes.shape(AuthorPropTypes)).isRequired,
  year: React.PropTypes.string.isRequired,
  reference: React.PropTypes.shape(ReferencePropTypes), // might be missing if it could not be matched
};

@connect(state => ({pdf: state.pdf}))
export default class PDFCitations extends React.Component {
  render() {
    const {pdf} = this.props;
    const originalPaper = pdf.renderPaper();
    // use linking logic from academia
    const paper = linkPaper(originalPaper);

    var regExp = citeRegExp;
    // replace references
    function highlightCitations(string) {
      // reset the regex
      regExp.lastIndex = 0;
      // set up the iteration variables
      var previousLastIndex = regExp.lastIndex;
      var elements = [];
      var match;
      while ((match = regExp.exec(string)) !== null) {
        var prefix = string.slice(previousLastIndex, match.index);
        elements.push(prefix, <span className="citation">{match[0]}</span>);
        previousLastIndex = regExp.lastIndex;
      }
      var postfix = string.slice(previousLastIndex);
      elements.push(postfix);
      return elements;
    }

    return (
      <div>
        <section className="hpad">
          <h2>Body</h2>
          {paper.sections.filter(section => !/References?/.test(section.title)).map((section, i) =>
            <div key={i} className="paper-section">
              <h4>{highlightCitations(section.title)}</h4>
              {section.paragraphs.map(paragraph => highlightCitations(paragraph))}
            </div>
          )}
        </section>
        <h3 className="hpad">Bibliography References</h3>
        <table className="fill padded striped lined">
          <thead>
            <tr>
              <th>Index</th>
              <th>Authors</th>
              <th>Year</th>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            {paper.references.map((reference, i) =>
              <ReferenceRow key={i} index={i} {...reference} />
            )}
          </tbody>
        </table>
        <h3 className="hpad">Inline Citations</h3>
        <table className="fill padded striped lined">
          <thead>
            <tr>
              <th>Index</th>
              <th>Authors</th>
              <th>Year</th>
              <th>Matched Reference</th>
            </tr>
          </thead>
          <tbody>
            {paper.cites.map((citation, i) =>
              <CitationRow key={i} index={i} {...citation} />
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
