import { Organ } from './organ';
import { HOVER_OPACITY } from './global';

export class TrashCan extends Phaser.GameObjects.Sprite {

    readonly doctorPosition: Phaser.Geom.Point;
    private pitSound: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, 0, 0, 'pit');
        this.x = x;
        this.y = y;
        this.depth = this.y + this.height / 2;
        this.doctorPosition = new Phaser.Geom.Point(this.x - 30, this.y - 13);
        this.pitSound = this.scene.sound.add('pit');
        this.setInteractive();
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.alpha = 1);
    }

    popOrgan(type: string): Organ {
        return null;
    }

    setOrgan(organ: Organ): boolean {
        this.scene.add.existing(organ);
        organ.x = this.x
        organ.y = this.y - 22;
        this.scene.tweens.add({
            targets: organ,
            y: this.y + 20,
            ease: 'Quad.In',
            duration: 500,
            onComplete: () => {
                organ.destroy();
            }
        });
        this.pitSound.play();
        return true;
    }

}
