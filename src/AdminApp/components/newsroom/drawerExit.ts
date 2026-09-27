export type DrawerExit = { kind: 'close' } | { kind: 'edit'; href: string; returnUrl: string };
export type EditorialSaveResult = { ok: true } | { ok: false; error: string };

export function requestDrawerExit(
  isDirty: boolean,
  exit: DrawerExit,
  confirm: (exit: DrawerExit) => void,
  perform: (exit: DrawerExit) => void,
) {
  if (isDirty) confirm(exit);
  else perform(exit);
}

export async function saveAndContinue(
  exit: DrawerExit,
  save: () => Promise<EditorialSaveResult>,
  perform: (exit: DrawerExit) => void,
): Promise<EditorialSaveResult> {
  const result = await save();
  if (result.ok) perform(exit);
  return result;
}
