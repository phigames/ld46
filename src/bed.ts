import 'phaser';
import { Patient } from './patient';
import { Organ } from './organ';


const WIDTH = 50;
const HEIGHT = 50;
const SPACING = 70;
const YPOS = 100;


export class Bed extends Phaser.GameObjects.Container {

    patient: Patient;
    protected sprite: Phaser.GameObjects.Sprite;
    readonly onOrganClick: (patient: Patient, organ: Organ) => void;

    constructor(scene: Phaser.Scene, slot: number, onOrganClick: (patient: Patient, organ: Organ) => void) {
        super(scene, WIDTH, HEIGHT);
        this.patient = null;
        this.onOrganClick = onOrganClick;
        this.x = 50 + slot * SPACING;
        this.y = YPOS;
        this.createSprite();
        this.setInteractive();
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'bed', 0);
        this.add(this.sprite);
        let infoField = this.scene.add.image(0, -50, 'info_field');
        this.add(infoField);
        this.setSize(50, 50);
    }

    canBeInserted(organ: Organ): boolean {
        return this.patient.organs[organ.getType()] === null;
    }

    generatePatient(difficulty: number) {
        this.patient = new Patient(this.scene, this);
        this.patient.addOrganClickListeners();
        this.sprite.setFrame(1);
    }

    hasPatient(): boolean {
        return this.patient !== null;
    }

}
