export async function recordLoginAttempt(db,key,now){
 const [row]=await db.query('INSERT INTO login_attempts (key,attempts,window_start) VALUES ($1,1,$2) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.window_start<$3 THEN 1 ELSE login_attempts.attempts+1 END, window_start=CASE WHEN login_attempts.window_start<$3 THEN excluded.window_start ELSE login_attempts.window_start END RETURNING attempts',[key,now,now-15*60*1000]);
 return row?.attempts||0;
}
