// Did the write actually happen?
//
// PostgREST answers a write that RLS blocked with **no error and no rows**: the
// statement ran, matched nothing, and succeeded. An update or a delete that a
// policy refuses therefore looks identical to one that worked, unless the
// returned row is checked as well.
//
// Reporting that as saved is how a panel tells somebody their change went
// through when it did not — the number snaps back and nothing explains why. So
// every update and delete in the panel asks for a row back and runs it through
// here.
//
// Inserts do not need this: a blocked insert comes back as 42501.
export function wroteNothing(error: unknown, row: unknown): boolean {
  return !error && (row === null || row === undefined);
}

// What to say when it happens. It is nearly always a missing policy or a
// session that has dropped below aal2, and neither is something she can act on
// — but "it did not save" is, because it stops her walking away believing it
// did.
export const NOT_SAVED =
  "Değişiklik kaydedilemedi. Yetkiniz düşmüş olabilir — çıkıp tekrar girin.";
