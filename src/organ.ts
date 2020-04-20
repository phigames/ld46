import 'phaser';
import { Bed } from './bed';
import { uglySettings, HOVER_OPACITY, FONT_FAMILY, DARK_COLOR } from './global';
import { Patient } from './patient';


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
    patient: Patient;
    pickedUp: boolean;
    private selected: boolean;
    readonly countdownText: Phaser.GameObjects.Text;
    private beepSound: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, organType: OrganType, bed?: Bed, patient?: Patient) {
        let offset = OFFSET[organType];
        super(scene, offset.x, offset.y, 'organ_' + organType);
        this.scene.add.existing(this);
        this.organType = organType;
        this.timeToDecay = null;
        this.dead = false;
        this.pickedUp = false;
        this.selected = false;
        this.countdownText = scene.add.text(0, Math.round(offset.y - 5), '', { fontFamily: FONT_FAMILY, color: DARK_COLOR, fontSize: '8px' });
        this.beepSound = this.scene.sound.add('beep');
        this.tintFill = false;
        this.setInteractive();
        if (bed !== undefined) {
            this.addToBed(bed);
        } else {
            this.on('pointerover', () => this.alpha = HOVER_OPACITY);
            this.on('pointerout', () => this.alpha = 1);
        }
        if (patient !== undefined) {
            this.patient = patient;
        } else {
            this.patient = null;
        }
        
        this.on('destroy', () => {
            this.countdownText.destroy();
        });
    }

    get doctorPosition(): Phaser.Geom.Point {
        return new Phaser.Geom.Point(this.x - 10, this.y);
    }

    setSelected(selected: boolean) {
        this.selected = selected;
    }

    removeFromBed(bed: Bed) {
        bed.remove(this);
        bed.remove(this.countdownText);
        this.patient = null;
        this.alpha = 1;
        this.off('pointerover');
        this.off('pointerout');
        this.beepSound.stop();
    }

    addToBed(bed: Bed) {
        bed.add(this);
        bed.add(this.countdownText);
        this.patient = bed.patient;
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
            this.timeToDecay -= delta;
            this.countdownText.setText(this.getCountdown());
            if (this.timeToDecay < 5000) {
                if (this.timeToDecay % 500 > 250) {
                    this.countdownText.setColor('#ff0000');
                } else {
                    this.countdownText.setColor('#000000');
                }
                if (!this.beepSound.isPlaying) {
                    this.beepSound.play({
                        loop: true
                    });
                }
            }
            if (this.timeToDecay <= 0) {
                this.dead = true;
                this.setTint(0x3a5941);
                this.timeToDecay = null;
                this.countdownText.setText('---');
                this.beepSound.stop();
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
