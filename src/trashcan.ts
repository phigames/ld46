import { Organ } from './organ';

export class TrashCan extends Phaser.GameObjects.Sprite {

    readonly doctorPosition: Phaser.Geom.Point;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'bed');
        this.x = 300;
        this.y = 200;
        this.doctorPosition = new Phaser.Geom.Point(this.x - 20, this.y);
        this.setInteractive();
        this.on('pointerover', () => this.alpha = 0.5);
        this.on('pointerout', () => this.alpha = 1);
    }

    popOrgan(type: string): Organ {
        return null;
    }

    setOrgan(organ: Organ): boolean {
        return true;
    }

}
