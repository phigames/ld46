import 'phaser';
import { Patient } from './patient';
import { Organ } from './organ';


const WIDTH = 50;
const HEIGHT = 50;
const SPACING = 60;
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
        this.on('pointerover', () => this.sprite.alpha = 0.5);
        this.on('pointerout', () => this.sprite.alpha = 1);
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'bed', 0);
        this.add(this.sprite);
        let infoBoard = this.scene.add.image(0, -50, 'infoboard');
        this.add(infoBoard);
        this.setSize(40, 50);
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
