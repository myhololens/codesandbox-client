import React from 'react';
import styled, { css } from 'styled-components';
import EditIcon from 'react-icons/lib/go/pencil';
import { graphql } from 'gatsby';

import media from '../utils/media';

import DocSearch from '../components/DocSearch';
import TitleAndMetaTags from '../components/TitleAndMetaTags';
import Layout from '../components/layout';
import PageContainer from '../components/PageContainer';
import StickyNavigation from '../components/StickyNavigation';

const Container = styled.div`
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
`;

const cardCSS = css`
  background-color: ${props => props.theme.background};
  padding: 1.5rem;
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  margin-bottom: 1rem;
`;

const Article = styled.div`
  flex: 3;

  padding-right: 1rem;

  ${media.phone`
    padding-right: 0;
  `};
`;

const DocsContainer = styled.div`
  display: flex;
  ${media.phone`
    flex-direction: column;
  `};
`;

const DocumentationContent = styled.div`
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  font-feature-settings: normal;

  iframe {
    display: block;
    margin: auto;
    border: 0;
    outline: 0;
  }

  h2 {
    font-family: 'Poppins', sans-serif;
    margin: 1.5rem 0;
    font-weight: 400;
    color: white;

    &:first-child {
      margin-top: 0rem;
    }
  }

  h3 {
    font-weight: 400;
    font-size: 1.25rem;
    color: white;
    margin-top: 2rem;
  }

  section {
    ${cardCSS};
    overflow-x: auto;
  }

  iframe {
    nargin-bottom: 1rem;
  }

  code {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.2em 0.4em;
    font-size: 85%;
    margin: 0;
    border-radius: 3px;
  }

  code,
  pre {
    font-family: source-code-pro, Menlo, Monaco, Consolas, Courier New,
      monospace;
  }

  *:last-child {
    margin-bottom: 0;
  }

  .anchor {
    fill: ${props => props.theme.secondary};
  }

  .gatsby-highlight {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 1rem;

    code {
      background-color: transparent;
      padding: 0;
      margin: 0;
      font-size: 100%;
      height: auto !important;
      line-height: 20px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .token.attr-name {
    color: ${props => props.theme.secondary};
  }

  .token.tag {
    color: #ec5f67;
  }

  .token.string {
    color: #99c794;
  }

  .token.keyword {
    color: ${props => props.theme.secondary};
  }

  .token.boolean,
  .token.function {
    color: #fac863;
  }

  .token.property,
  .token.attribute {
    color: ${props => props.theme.secondary};
  }

  .token.comment,
  .token.block-comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #626466;
  }
`;

const Edit = styled.a`
  transition: 0.3s ease color;
  display: flex;
  align-items: center;
  position: absolute;
  top: 2.5rem;
  right: 2.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 1rem;
  text-decoration: none;

  ${media.phone`
    display: none;
  `};

  svg {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.75);
    margin-right: 0.5rem;
  }

  &:hover {
    color: white;
  }
`;

const Heading = styled.div`
  ${cardCSS};
  position: relative;

  background-image: linear-gradient(
    -45deg,
    ${({ theme }) => theme.secondary.darken(0.1)()} 0%,
    ${({ theme }) => theme.secondary.darken(0.3)()} 100%
  );
  padding: 2rem 2rem;
  color: white;
`;

const Title = styled.h1`
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 1.125rem;
  font-weight: 400;

  margin-bottom: 0.25rem;
`;

// eslint-disable-next-line
export default class Docs extends React.Component {
  render() {
    const { data } = this.props;

    const { edges: docs } = data.allMarkdownRemark;
    const { html, frontmatter, fields } = data.markdownRemark;

    return (
      <Layout>
        <Container style={{ overflowX: 'auto' }}>
          <TitleAndMetaTags
            title={`${frontmatter.title} - CodeSandbox Documentation`}
            description={frontmatter.description}
          />
          <PageContainer>
            <DocsContainer>
              <div
                style={{
                  flex: 1,
                  minWidth: 250,
                }}
              >
                <DocSearch />
                <StickyNavigation docs={docs} />
              </div>
              <Article>
                <Heading>
                  <Title>{frontmatter.title}</Title>
                  <Edit
                    href={`https://github.com/codesandbox/codesandbox-client/tree/master/packages/homepage/content/${
                      fields.path
                    }`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <EditIcon /> Edit this page
                  </Edit>
                  <Description>{frontmatter.description}</Description>
                </Heading>

                <DocumentationContent
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </Article>
            </DocsContainer>
          </PageContainer>
        </Container>
      </Layout>
    );
  }
}

export const pageQuery = graphql`
  query Docs($slug: String!) {
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "/docs/" } } }
      sort: { fields: [fileAbsolutePath], order: ASC }
    ) {
      edges {
        node {
          headings(depth: h2) {
            value
          }
          frontmatter {
            title
          }
          fields {
            url
          }
        }
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        description
      }
      fields {
        path
      }
    }
  }
`;
