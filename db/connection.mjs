import {neon} from '@neondatabase/serverless';

// Neon is authoritative once configured. Never fall back after a Neon error.
// D1 preserves the existing inventory until the first cutover is ready.
/** @param {{DATABASE_URL?:string, DB?:any}} bindings */
export function createDatabase({DATABASE_URL, DB}) {
  if (DATABASE_URL) {
    const sql = neon(DATABASE_URL);
    return {
      provider: 'neon',
      query: (text, values = []) => sql.query(text, values),
      transaction: statements => sql.transaction(statements.map(({text,values=[]}) => sql.query(text,values))),
    };
  }
  if (!DB) throw new Error('Configura DATABASE_URL para conectar Neon.');
  function prepare(text, values = []) {
    const parameters = [];
    const legacy = text.replace(/\$(\d+)/g, (_, number) => {
      const value = values[Number(number)-1];
      parameters.push(typeof value === 'boolean' ? Number(value) : value);
      return '?';
    });
    return DB.prepare(legacy).bind(...parameters);
  }
  return {
    provider: 'd1',
    query: async (text, values = []) => (await prepare(text,values).all()).results,
    transaction: statements => DB.batch(statements.map(({text,values=[]}) => prepare(text,values))),
  };
}
