import type { Profile } from '@hey/lens';
import type { FC, ReactNode } from 'react';

import {
  CheckBadgeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import { useProfileLazyQuery } from '@hey/lens';
import getAvatar from '@hey/lib/getAvatar';
import getMentions from '@hey/lib/getMentions';
import getProfile from '@hey/lib/getProfile';
import hasMisused from '@hey/lib/hasMisused';
import nFormatter from '@hey/lib/nFormatter';
import truncateByWords from '@hey/lib/truncateByWords';
import { Card, Image } from '@hey/ui';
import isVerified from '@lib/isVerified';
import * as HoverCard from '@radix-ui/react-hover-card';
import { motion } from 'framer-motion';
import plur from 'plur';
import { useState } from 'react';

import Markup from './Markup';
import Slug from './Slug';

const MINIMUM_LOADING_ANIMATION_MS = 800;

interface UserPreviewProps {
  children: ReactNode;
  handle?: string;
  id?: string;
  showUserPreview?: boolean;
}

const UserPreview: FC<UserPreviewProps> = ({
  children,
  handle,
  id,
  showUserPreview = true
}) => {
  const [profile, setProfile] = useState<Profile | undefined>();
  const [loadProfile, { loading: networkLoading }] = useProfileLazyQuery({
    fetchPolicy: 'no-cache'
  });

  const [syntheticLoading, setSyntheticLoading] =
    useState<boolean>(networkLoading);

  const onPreviewStart = async () => {
    if (profile || networkLoading) {
      return;
    }

    setSyntheticLoading(true);
    await loadProfile({
      onCompleted: (data) => setProfile(data?.profile as Profile),
      variables: {
        request: { ...(id ? { forProfileId: id } : { forHandle: handle }) }
      }
    });
    setTimeout(() => {
      setSyntheticLoading(false);
    }, MINIMUM_LOADING_ANIMATION_MS);
  };

  if (!id && !handle) {
    return null;
  }

  if (!showUserPreview) {
    return <span>{children}</span>;
  }

  const Preview = () => {
    if (networkLoading || syntheticLoading) {
      return (
        <div className="flex flex-col">
          <div className="horizontal-loader w-full">
            <div />
          </div>
          <div className="flex p-3">
            <div>{handle || `#${id}`}</div>
          </div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="flex h-12 items-center px-3">No profile found</div>
      );
    }

    const UserAvatar = () => (
      <Image
        alt={profile.id}
        className="size-10 rounded-full border bg-gray-200 dark:border-gray-700"
        height={40}
        loading="lazy"
        src={getAvatar(profile)}
        width={40}
      />
    );

    const UserName = () => (
      <>
        <div className="flex max-w-sm items-center gap-1 truncate">
          <div className="text-md">{getProfile(profile).displayName}</div>
          {isVerified(profile.id) ? (
            <CheckBadgeIcon className="text-brand-500 size-4" />
          ) : null}
          {hasMisused(profile.id) ? (
            <ExclamationCircleIcon className="size-4 text-red-500" />
          ) : null}
        </div>
        <span>
          <Slug className="text-sm" slug={getProfile(profile).slugWithPrefix} />
          {profile.operations.isFollowingMe.value ? (
            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
              Follows you
            </span>
          ) : null}
        </span>
      </>
    );

    return (
      <div className="space-y-3 p-4">
        <UserAvatar />
        <UserName />
        <div>
          {profile.metadata?.bio ? (
            <div className="linkify mt-2 break-words text-sm leading-6">
              <Markup mentions={getMentions(profile.metadata.bio)}>
                {truncateByWords(profile.metadata.bio, 20)}
              </Markup>
            </div>
          ) : null}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="text-base">
              {nFormatter(profile.stats.following)}
            </div>
            <div className="ld-text-gray-500 text-sm">
              {plur('Following', profile.stats.following)}
            </div>
          </div>
          <div className="text-md flex items-center space-x-1">
            <div className="text-base">
              {nFormatter(profile.stats.followers)}
            </div>
            <div className="ld-text-gray-500 text-sm">
              {plur('Follower', profile.stats.followers)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <span onFocus={onPreviewStart} onMouseOver={onPreviewStart}>
      <HoverCard.Root>
        <HoverCard.Trigger asChild>
          <span>{children}</span>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            asChild
            className="w-64 z-10"
            side="bottom"
            sideOffset={5}
          >
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <Card forceRounded>
                <Preview />
              </Card>
            </motion.div>
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    </span>
  );
};

export default UserPreview;
