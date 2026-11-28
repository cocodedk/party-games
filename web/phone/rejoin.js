// Brings a dropped phone back into the game with the same room, name and team: at once if the page
// is showing, else as soon as it shows again (the player took a call, the screen locked). The caller
// asks only for a phone that was in the game, so a failed attempt ends there instead of retrying forever.
export function createRejoin(join) {
  let wanted = false;
  const tryNow = () => {
    if (!wanted || document.hidden) return;
    wanted = false;
    join();
  };
  document.addEventListener('visibilitychange', tryNow);
  return {
    dropped() {
      wanted = true;
      tryNow();
    },
  };
}
