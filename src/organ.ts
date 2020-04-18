import 'phaser';
import { FONT_FAMILY, DARK_COLOR } from './game';
import { Bed } from './bed';


export type OrganType = 'cranium' | 'liver' | 'nephro';
export const ORGAN_TYPES: OrganType[] = ['cranium', 'liver', 'nephro'];

const OFFSET: Record<OrganType, Phaser.Geom.Point> = {
    cranium: new Phaser.Geom.Point(-15, -65),
    liver: new Phaser.Geom.Point(-15, -50),
    nephro: new Phaser.Geom.Point(-15, -35)
}


export class Organ extends Phaser.GameObjects.Sprite {

    type: string;
    private originalTimeToDecay: number;
    private timeToDecay: number;
    private dead: boolean;
    private countdownText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, type: string, bed: Bed) {
        let offset = OFFSET[type];
        super(scene, offset.x, offset.y, 'organ_' + type);
        this.scene.add.existing(this);
        bed.add(this);
        this.type = type;
        this.timeToDecay = null;
        this.dead = false;
        this.countdownText = scene.add.text(offset.x + 15, offset.y - 5, '', { fontFamily: FONT_FAMILY, color: DARK_COLOR, fontSize: '8px' });
        bed.add(this.countdownText);
        this.setInteractive();
    }

    startDecay(timeToDecay: number) {
        this.originalTimeToDecay = this.timeToDecay = timeToDecay;
    }

    hasProblem(): boolean {
        return this.dead || this.timeToDecay !== null;
    }

    isDead(): boolean {
        return this.dead;
    }

    getCountdown(): string {
        return `${Math.floor(this.timeToDecay / 1000 / 60).toString().padStart(2, '0')}:${Math.floor(this.timeToDecay / 1000 % 60).toString().padStart(2, '0')}`;
    }

    update(time: number, delta: number) {
        if (this.timeToDecay !== null) {
            this.countdownText.setText(this.getCountdown());
            this.timeToDecay -= delta;
            if (this.timeToDecay <= 0) {
                this.dead = true;
                this.setTint(0x3a5941);
                this.timeToDecay = null;
                this.countdownText.setText('xxx');
            } else {
                // green: 0x3a5941
                let progress = 0.6 * this.timeToDecay / this.originalTimeToDecay;
                let red = 0x3a + (0xFF - 0x3a) * progress;
                let green = 0x59 + (0xFF - 0x59) * progress;
                let blue = 0x41 + (0xFF - 0x41) * progress;
                let tint = ((red << 8) + green << 8) + blue;
                this.setTint(tint);
            }
        }
    }

}
