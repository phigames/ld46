import 'phaser';
import { Bed } from './bed';
import { Organ, OrganType, ORGAN_TYPES } from './organ';
import { uglySettings, MIN_PROBLEM_INTERVAL, MAX_PROBLEM_INTERVAL } from './global';


export class Patient extends Phaser.GameObjects.Container {

    private bed: Bed;
    organs: Record<OrganType, Organ>;
    private nextProblemTime: number;
    readonly doctorPosition: Phaser.Geom.Point;

    constructor(scene: Phaser.Scene, bed: Bed) {
        super(scene, 100, 100);
        this.bed = bed;
        this.organs = {
            cranium: new Organ(this.scene, 'cranium', bed),
            liver: new Organ(this.scene, 'liver', bed),
            nephro: new Organ(this.scene, 'nephro', bed)
        };

        this.nextProblemTime = MIN_PROBLEM_INTERVAL + Math.random() * (MAX_PROBLEM_INTERVAL - MIN_PROBLEM_INTERVAL);
        this.doctorPosition = new Phaser.Geom.Point(bed.x - 20, bed.y + 30);
        this.on('destroy', () => {
            for (let organType of ORGAN_TYPES) {
                if (this.organs[organType] !== null) {
                    this.organs[organType].destroy()
                    this.organs[organType] = null;
                }
            }
        });
    }

    update(time: number, delta: number) {
        if (uglySettings.updatesPaused) {
            return;
        }
        this.nextProblemTime -= delta;
        if (this.nextProblemTime <= 0) {
            this.nextProblem();
            this.nextProblemTime = 10000;
        }
        
        let dead = true;
        for (let organType of ORGAN_TYPES) {
            if (this.organs[organType] !== null) {
                this.organs[organType].update(time, delta);
                if (!this.organs[organType].isDead()) {
                    dead = false;
                }
            }
        }
        if (dead) {
            this.bed.onPatientDied();
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

    popOrgan(type: OrganType): Organ {
        if (this.organs[type] !== null) {
            let organ: Organ = this.organs[type];
            organ.removeFromBed(this.bed);
            organ.off('pointerdown');
            this.organs[type] = null;
            return organ;
        }
        return null;
    }

    setOrgan(organ: Organ): boolean {
        let type = organ.getType();
        
        if (this.organs[type] === null) {
            organ.addToBed(this.bed);
            organ.on('pointerdown', () => this.bed.onOrganClick(this, organ));
            this.organs[type] = organ;
            return true;
        }
        return false;
    }

    addOrganClickListeners() {
        for (const organType of ORGAN_TYPES) {
            if (this.organs[organType] !== null) {
                this.organs[organType].on('pointerdown', () => this.bed.onOrganClick(this, this.organs[organType]));
            }
        }
    }

}
