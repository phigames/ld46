import { Organ, ORGAN_TYPES } from './organ';
import { HOVER_OPACITY } from './global';
import { Doctor } from './doctor';

export class Grinder extends Phaser.GameObjects.Sprite {

    readonly doctorPosition: Phaser.Geom.Point;
    private origX: number;
    private origY: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, 0, 0, 'grinder_front');
        this.x = this.origX = x;
        this.y = this.origY = y;
        this.depth = this.y + this.height;
        this.doctorPosition = new Phaser.Geom.Point(this.x - 40, this.y);
        this.setInteractive();
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.alpha = 1);
    }

    grind(doctor: Doctor) {
        // move doctor in
        this.scene.tweens.add({
            targets: doctor,
            x: this.x,
            duration: 1000,
            onComplete: () => {
                // remove doctor
                this.scene.children.remove(doctor);
                // shake
                this.scene.time.addEvent({
                    delay: 10,
                    repeat: 100,
                    callback: () => {
                        this.x = this.origX + Math.random() * 8 - 4;
                        this.y = this.origY + Math.random() * 8 - 4;
                    }
                });
                // spawn organs
                let organs: Organ[] = [];
                let r = Math.random();
                if (r < 0.33) {
                    organs.push(new Organ(this.scene, 'cranium'));
                    organs.push(new Organ(this.scene, 'liver'));
                } else if (r < 0.67) {
                    organs.push(new Organ(this.scene, 'liver'));
                    organs.push(new Organ(this.scene, 'nephro'));
                } else {
                    organs.push(new Organ(this.scene, 'cranium'));
                    organs.push(new Organ(this.scene, 'nephro'));
                }
                for (let organ of organs) {
                    organ.x = this.x;
                    organ.y = this.y;
                    this.scene.add.existing(organ);
                    this.scene.tweens.add({
                        targets: organ,
                        x: this.x + 50 + Math.random() * 50,
                        y: this.y + Math.random() * 50 - 25,
                        duration: 500,
                        delay: 1000,
                        ease: 'Quad.easeOut'
                    })
                }
            }
        });
    }

}
