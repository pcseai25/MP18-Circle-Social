import type { FC } from 'react';

import { useFeatureFlagsStore } from 'src/store/persisted/useFeatureFlagsStore';

const Footer: FC = () => {
  const staffMode = useFeatureFlagsStore((state) => state.staffMode);

  return (
    <footer
      className={`sticky text-sm leading-7 ${staffMode ? 'top-28' : 'top-20'}`}
    >
      Circle Social
    </footer>
  );
};

export default Footer;
