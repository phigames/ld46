import 'phaser';
import { Bed } from './bed';
import { Organ, OrganType, ORGAN_TYPES } from './organ';
import { uglySettings, MIN_PROBLEM_INTERVAL, MAX_PROBLEM_INTERVAL, ORGAN_TIME_TO_DECAY } from './global';


export class Patient extends Phaser.GameObjects.Container {

    bed: Bed;
    organs: Record<OrganType, Organ>;
    private nextProblemTime: number;
    readonly doctorPosition: Phaser.Geom.Point;
    private problemSound: Phaser.Sound.BaseSound;
    private extractOrganSound: Phaser.Sound.BaseSound;
    private insertOrganSound: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, bed: Bed) {
        super(scene);
        this.bed = bed;
        this.organs = {
            cranium: new Organ(this.scene, 'cranium', bed, this),
            liver: Math.random() < 0.5 ? null : new Organ(this.scene, 'liver', bed, this),
            nephro: new Organ(this.scene, 'nephro', bed, this)
        };
        this.nextProblemTime = MIN_PROBLEM_INTERVAL + Math.random() * (MAX_PROBLEM_INTERVAL - MIN_PROBLEM_INTERVAL);
        this.doctorPosition = new Phaser.Geom.Point(bed.x - 20, bed.y + 30);
        this.problemSound = this.scene.sound.add('problem');
        this.extractOrganSound = this.scene.sound.add('extract_organ');
        this.insertOrganSound = this.scene.sound.add('insert_organ');
        this.on('destroy', () => {
            for (let organType of ORGAN_TYPES) {
                if (this.organs[organType] !== null) {
                    this.organs[organType].destroy()
                    this.organs[organType] = null;
                }
            }
            this.organs = null;
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
            organ.startDecay(ORGAN_TIME_TO_DECAY);
            this.problemSound.play();
        }
    }

    popOrgan(type: OrganType): Organ {
        if (this.organs === null) {
            return null;
        }
        if (this.organs[type] !== null) {
            let organ: Organ = this.organs[type];
            organ.removeFromBed(this.bed);
            organ.off('pointerdown');
            this.organs[type] = null;
            this.extractOrganSound.play();
            return organ;
        }
        return null;
    }

    setOrgan(organ: Organ): boolean {
        if (this.organs === null) {
            return false;
        }
        let type = organ.getType();
        if (this.organs[type] === null) {
            organ.addToBed(this.bed);
            organ.on('pointerdown', () => this.bed.onOrganClick(this, organ));
            this.organs[type] = organ;
            this.insertOrganSound.play();
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
