import { Organ } from './organ';
import { HOVER_OPACITY } from './global';

export class TrashCan extends Phaser.GameObjects.Sprite {

    readonly doctorPosition: Phaser.Geom.Point;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, 0, 0, 'bed');
        this.x = x;
        this.y = y;
        this.depth = this.y + this.height;
        this.doctorPosition = new Phaser.Geom.Point(this.x - 20, this.y);
        this.setInteractive();
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.alpha = 1);
    }

    popOrgan(type: string): Organ {
        return null;
    }

    setOrgan(organ: Organ): boolean {
        return true;
    }

}
