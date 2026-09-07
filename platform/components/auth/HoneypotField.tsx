// A field real users never see or reach: positioned off-screen (not
// display:none — some bots skip hidden fields, few check computed position)
// and pulled out of both the tab order and the accessibility tree, so it
// never confuses keyboard or screen-reader users. Any automated client that
// fills every input it finds will fill this one; the server rejects the
// submission if it's non-empty (see modules/auth/auth.service.ts).
export function HoneypotField({ name = 'website' }: { name?: string }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, width: 0, overflow: 'hidden' }}>
      <label htmlFor={name}>Leave this field empty</label>
      <input type="text" id={name} name={name} tabIndex={-1} autoComplete="off" />
    </div>
  );
}
