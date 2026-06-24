// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_concerned_psylocke.sql';
import m0001 from './0001_broad_blur.sql';
import m0002 from './0002_fancy_timeslip.sql';
import m0003 from './0003_cheerful_magus.sql';
import m0004 from './0004_parallel_nextwave.sql';
import m0005 from './0005_true_salo.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005
    }
  }
  