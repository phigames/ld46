import 'phaser';
import { Bed } from './bed';
import { Organ, OrganType, ORGAN_TYPES } from './organ';


interface Problem {
    organType: string;
    timeToFailure: number;
}


export class Patient extends Phaser.GameObjects.Container {

    private organs: Record<OrganType, Organ>;
    private nextProblemTime: number;
    doctorPosition: Phaser.Geom.Point;

    constructor(scene: Phaser.Scene, bed: Bed) {
        super(scene, 100, 100);
        this.organs = {
            cranium: new Organ(this.scene, 'cranium', bed),
            liver: new Organ(this.scene, 'liver', bed),
            nephro: new Organ(this.scene, 'nephro', bed)
        };
        
        this.doctorPosition = new Phaser.Geom.Point(bed.x - 20, bed.y);

        this.scene.events.on('update', this.update.bind(this));
    }

    update(time: number, delta: number) {
        if (time >= this.nextProblemTime) {
            this.nextProblem();
        }
        
        for (let organType of ORGAN_TYPES) {
            if (this.organs[organType] !== null) {
                this.organs[organType].update(time, delta);
            }
        }
    }

    private nextProblem() {
        console.log('problem');
    }

    popOrgan(type: string): Organ {
        if (this.organs[type] === null) {
            let organ = this.organs[type];
            this.organs[type] = null;
            return organ;
        }
        return null;
    }

    setOrgan(organ: Organ): boolean {
        let type = organ.type;
        if (this.organs[type] === null) {
            this.organs[type] = organ;
            return true;
        }
        return false;
    }

    addOrganClickListeners(callback: (patient: Patient, organType: OrganType) => void) {
        for (const organType of ORGAN_TYPES) {
            if (this.organs[organType] !== null) {
                this.organs[organType].on('pointerdown', () => callback(this, organType));
            }
        }
    }

}
