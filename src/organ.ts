import 'phaser';
import { Bed } from './bed';
import { uglySettings, HOVER_OPACITY, FONT_FAMILY, DARK_COLOR } from './global';


export type OrganType = 'cranium' | 'liver' | 'nephro';
export const ORGAN_TYPES: OrganType[] = ['cranium', 'liver', 'nephro'];

const OFFSET: Record<OrganType, Phaser.Geom.Point> = {
    cranium: new Phaser.Geom.Point(-14, -45),
    liver: new Phaser.Geom.Point(-14, -26),
    nephro: new Phaser.Geom.Point(-14, -9)
}


export class Organ extends Phaser.GameObjects.Sprite {

    private organType: OrganType;
    private originalTimeToDecay: number;
    private timeToDecay: number;
    private dead: boolean;
    owned: boolean;
    private countdownText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, organType: OrganType, bed: Bed = null) {
        let offset = OFFSET[organType];
        super(scene, offset.x, offset.y, 'organ_' + organType);
        this.scene.add.existing(this);
        this.organType = organType;
        this.timeToDecay = null;
        this.dead = false;
        this.owned = false;
        this.countdownText = scene.add.text(0, offset.y - 5, '', { fontFamily: FONT_FAMILY, color: DARK_COLOR, fontSize: '8px' });
        this.setInteractive();
        if (bed !== null) {
            this.addToBed(bed);
        } else {
            this.on('pointerover', () => this.alpha = HOVER_OPACITY);
            this.on('pointerout', () => this.alpha = 1);
        }
    }

    get doctorPosition(): Phaser.Geom.Point {
        return new Phaser.Geom.Point(this.x, this.y);
    }

    removeFromBed(bed: Bed) {
        bed.remove(this);
        bed.remove(this.countdownText);
        this.alpha = 1;
        this.off('pointerover');
        this.off('pointerout');
    }

    addToBed(bed: Bed) {
        bed.add(this);
        bed.add(this.countdownText);
        this.x = OFFSET[this.organType].x;
        this.y = OFFSET[this.organType].y;
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.alpha = 1);
    }

    getType(): OrganType {
        return this.organType;
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
        if (uglySettings.updatesPaused) {
            return;
        }
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
