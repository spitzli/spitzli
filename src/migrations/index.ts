import * as migration_20260919_103938_initial from './20260919_103938_initial';

export const migrations = [
  {
    up: migration_20260919_103938_initial.up,
    down: migration_20260919_103938_initial.down,
    name: '20260919_103938_initial'
  },
];
