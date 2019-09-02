import React from 'react';
import styled, { css } from 'styled-components';
import theme from '@codesandbox/common/lib/theme';

import { Link } from 'gatsby';
import { Router } from '@reach/router';
import slugify from '@codesandbox/common/lib/utils/slugify';

import media from '../utils/media';
import getScrollPos from '../utils/scroll';

const Navigation = styled.nav`
  padding-top: 2rem;
  margin-right: 1rem;
  width: 300px;

  ${props =>
    props.fixed &&
    css`
      position: fixed;
      top: 0;
      height: 100vh;
    `};

  ${props =>
    props.absoluteTop &&
    css`
      position: absolute;
      top: ${props.absoluteTop}px;
    `};

  ${media.phone`
    padding-bottom: 1rem;
    position: relative;
    padding-top: 0;
    top: 0;
  `};

  overflow-y: auto;

  ul {
    margin-left: 0;
    list-style: none;
  }

  a {
    text-decoration: none;
  }
`;

const NavigationItem = styled.li`
  margin-bottom: 1rem;
  padding: 0;
  border: 0;
`;

const PrimaryNavigationLink = styled(Link)`
  transition: 0.3s ease color;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  font-weight: 500;

  &:hover {
    color: white;
  }
`;

const SecondaryNavigationLink = styled(Link)`
  transition: 0.3s ease color;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 500;
  margin-left: 1rem;

  &:hover {
    color: white;
  }
`;

const MissingNotice = styled.a`
  transition: 0.3s ease color;
  display: block;
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;

  &:hover {
    color: white;
  }
`;

type Props = {
  docs: Array<{
    frontmatter: {
      title: string,
    },
    fields: {
      url: string,
    },
    headings: Array<{ value: string }>,
  }>,
};

const SubLink = ({ node }) => (
  <ul style={{ marginTop: '.5rem' }} path={node.fields.url}>
    {node.headings.map(({ value }) => (
      <li key={value}>
        <SecondaryNavigationLink to={`${node.fields.url}#${slugify(value)}`}>
          {value}
        </SecondaryNavigationLink>
      </li>
    ))}
  </ul>
);

export default class StickyNavigation extends React.PureComponent<Props> {
  state = {
    fixed: false,
  };

  componentDidMount() {
    // To prevent jumping
    setTimeout(() => {
      window.addEventListener('scroll', this.handleScroll);
      this.handleScroll();
    }, 500);
    const { y } = getScrollPos(Date.now(), false);

    const { top, height } = document
      .getElementById('navigation')
      .getBoundingClientRect();

    this.top = y + top;
    this.height = height;
    this.footerTop =
      y + document.getElementById('footer').getBoundingClientRect().top;
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const { y } = getScrollPos(Date.now(), false);

    if (y + this.height + 32 > this.footerTop) {
      this.setState({
        absoluteTop: this.footerTop - 32 - this.height,
        fixed: false,
      });
    } else if (y > this.top && !this.state.fixed) {
      this.setState({ fixed: true, absoluteTop: null });
    } else if (y < this.top && this.state.fixed) {
      this.setState({ fixed: false, absoluteTop: null });
    }
  };

  render() {
    const { docs } = this.props;

    const activeStyle = {
      color: theme.secondary(),
      fontWeight: 700,
    };

    return (
      <Navigation
        fixed={this.state.fixed}
        absoluteTop={this.state.absoluteTop}
        id="navigation"
      >
        <ul>
          {docs.map(({ node }) => (
            <NavigationItem key={node.frontmatter.title}>
              <PrimaryNavigationLink
                to={node.fields.url}
                activeStyle={activeStyle}
              >
                {node.frontmatter.title}
              </PrimaryNavigationLink>
              <Router>
                <SubLink node={node} path={node.fields.url} />
              </Router>
            </NavigationItem>
          ))}
        </ul>

        <MissingNotice
          href="https://github.com/codesandbox/codesandbox-client/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Missing documentation?
          <br />
          Open an issue here!
        </MissingNotice>
      </Navigation>
    );
  }
}
