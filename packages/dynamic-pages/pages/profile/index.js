import React from 'react';
import Link from 'next/link';
import FeaturedSandbox from '@codesandbox/common/lib/components/FeaturedSandbox';
import WideSandbox from '@codesandbox/common/lib/components/WideSandbox';
import Margin from '@codesandbox/common/lib/components/spacing/Margin';
import { camelizeKeys } from 'humps';

import openSandbox from '../../utils/openSandbox';
import NotFound from '../../screens/Profile/NotFound';
import Sidebar from '../../screens/Profile/sidebar';
import fetch from '../../utils/fetch';
import PageContainer from '../../components/PageContainer';
import SandboxesWrapper from '../../components/SandboxesWrapper';

import { Grid, Title, More } from './_elements';

const Profile = ({ profile, liked, showcased }) =>
  profile ? (
    <PageContainer>
      <Grid>
        <Sidebar {...profile} />
        <main
          css={`
            // chromebug
            display: block;
            min-height: 0;
            min-width: 0;
          `}
        >
          {showcased ? (
            <div
              css={`
                margin-bottom: 48px;
                font-size: 0.875rem;
              `}
            >
              <FeaturedSandbox
                height={450}
                pickSandbox={({ id }) => openSandbox(id)}
                sandbox={showcased}
                description={showcased.description}
                title={showcased.title || showcased.id}
              />
            </div>
          ) : null}
          <Title>User Sandboxes</Title>
          <SandboxesWrapper
            css={`
              grid-gap: 24px;
              margin-bottom: 48px;
            `}
          >
            {profile.top_sandboxes.map(sandbox => (
              <Margin key={sandbox.id} bottom={2}>
                <WideSandbox
                  defaultHeight={170}
                  noMargin
                  small
                  selectSandbox={({ id }) => openSandbox(id)}
                  sandbox={sandbox}
                />
              </Margin>
            ))}
            <More>
              <Link
                prefetch
                href={`/user-sandboxes?username=${
                  profile.username
                }&page=sandboxes`}
                as={`/profile/${profile.username}/sandboxes`}
              >
                <a>See all sandboxes</a>
              </Link>
            </More>
          </SandboxesWrapper>
          <Title>Liked sandboxes</Title>
          <SandboxesWrapper
            css={`
              grid-gap: 24px;
              margin-bottom: 48px;
            `}
          >
            {liked[1].slice(0, 5).map(sandbox => (
              <Margin key={sandbox.id} bottom={2}>
                <WideSandbox
                  noMargin
                  defaultHeight={170}
                  small
                  key={sandbox.id}
                  selectSandbox={({ id }) => openSandbox(id)}
                  sandbox={sandbox}
                />
              </Margin>
            ))}
            {liked[1].length > 5 && (
              <More>
                <Link
                  prefetch
                  href={`/user-sandboxes?username=${
                    profile.username
                  }&page=liked`}
                  as={`/profile/${profile.username}/liked`}
                >
                  <a>See all liked sandboxes</a>
                </Link>
              </More>
            )}
          </SandboxesWrapper>
        </main>
      </Grid>
    </PageContainer>
  ) : (
    <NotFound />
  );

Profile.getInitialProps = async ({ query: { username } }) => {
  const profile = await fetch(`/api/v1/users/${username}`);
  const sandboxes = await fetch(`/api/v1/users/${username}/sandboxes`);
  const liked = await fetch(`/api/v1/users/${username}/sandboxes/liked?page=1`);
  let showcased = { data: {} };
  if (profile.data) {
    showcased = await fetch(
      `/api/v1/sandboxes/${profile.data.showcased_sandbox_shortid}`
    );
  }
  return {
    profile: profile.data,
    sandboxes,
    liked,
    showcased: camelizeKeys(showcased.data),
  };
};

export default Profile;
