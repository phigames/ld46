import 'phaser';
import { Bed } from './bed';


export type OrganType = 'cranium' | 'liver' | 'nephro';
export const ORGAN_TYPES: OrganType[] = ['cranium', 'liver', 'nephro'];

const OFFSET = {
    
}


export class Organ extends Phaser.GameObjects.Sprite {

    private organType: OrganType;
    private originalTimeToDecay: number;
    private timeToDecay: number;
    private dead: boolean;

    constructor(scene: Phaser.Scene, organType: OrganType, bed: Bed) {
        super(scene, 0, -50, 'organ_' + organType);
        this.scene.add.existing(this);
        bed.add(this);
        this.organType = organType;
        this.timeToDecay = null;
        this.setInteractive();
        this.startDecay(2000);
    }

    getType(): OrganType {
        return this.organType;
    }

    startDecay(timeToDecay: number) {
        this.originalTimeToDecay = this.timeToDecay = timeToDecay;
    }

    isDead(): boolean {
        return this.dead;
    }

    update(time: number, delta: number) {
        if (this.timeToDecay !== null) {
            this.timeToDecay -= delta;
            if (this.timeToDecay <= 0) {
                this.dead = true;
                this.setFrame(1);
                this.setTint();
            } else {
                let progress = Math.floor(this.timeToDecay / this.originalTimeToDecay * 255);
                this.setTint(0x010101 * progress);
            }
        }
    }

}
