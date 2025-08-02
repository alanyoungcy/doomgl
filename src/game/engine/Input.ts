export type KeyState = { [key: string]: boolean };

export class Input {
  private keys: KeyState = {};
  private pointerLocked = false;
  private dx = 0;
  private dy = 0;
  sensitivity = 0.002;

  constructor(private el: HTMLElement) {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    el.addEventListener('click', () => {
      if (!this.pointerLocked) el.requestPointerLock();
    });
    el.addEventListener('mousemove', this.onMouseMove);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.el.removeEventListener('mousemove', this.onMouseMove);
  }

  isDown(k: string) {
    return !!this.keys[k.toLowerCase()];
  }

  consumeMouseDelta() {
    const out = { dx: this.dx, dy: this.dy };
    this.dx = 0;
    this.dy = 0;
    return out;
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys[e.key.toLowerCase()] = true;
  }
  private onKeyUp(e: KeyboardEvent) {
    this.keys[e.key.toLowerCase()] = false;
  }
  private onMouseMove(e: MouseEvent) {
    if (!this.pointerLocked) return;
    this.dx += e.movementX;
    this.dy += e.movementY;
  }
  private onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.el;
  }
}
