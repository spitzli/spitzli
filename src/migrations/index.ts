import * as migration_20260919_103938_initial from './20260919_103938_initial';
import * as migration_20260919_120657_blob_schema from './20260919_120657_blob_schema';

export const migrations = [
  {
    up: migration_20260919_103938_initial.up,
    down: migration_20260919_103938_initial.down,
    name: '20260919_103938_initial',
  },
  {
    up: migration_20260919_120657_blob_schema.up,
    down: migration_20260919_120657_blob_schema.down,
    name: '20260919_120657_blob_schema'
  },
];
