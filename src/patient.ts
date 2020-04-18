import 'phaser';
import { Bed } from './bed';
import { Organ, OrganType, ORGAN_TYPES } from './organ';


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

        this.nextProblemTime = Math.random() * 10000;
        this.doctorPosition = new Phaser.Geom.Point(bed.x - 20, bed.y);

        this.scene.events.on('update', this.update.bind(this));
    }

    update(time: number, delta: number) {
        this.nextProblemTime -= delta;
        if (this.nextProblemTime <= 0) {
            this.nextProblem();
            this.nextProblemTime = 10000;
        }
        
        for (let organType of ORGAN_TYPES) {
            if (this.organs[organType] !== null) {
                this.organs[organType].update(time, delta);
            }
        }
    }

    private nextProblem() {
        // find random available organ
        let organTypes = ORGAN_TYPES.slice();
        let organ = null;
        while (true) {
            let index = Math.floor(Math.random() * organTypes.length);
            let organType = organTypes[index];
            organTypes.splice(index, 1);
            organ = this.organs[organType];
            if (organ !== null && !organ.hasProblem()) {
                break;
            }
            if (organTypes.length == 0) {
                organ = null;
                break;
            }
        }

        if (organ !== null) {
            let timeToDecay = 5000;
            organ.startDecay(timeToDecay);
        }
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
