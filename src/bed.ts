import 'phaser';
import { Patient } from './patient';
import { OrganType } from './organ';


const WIDTH = 50;
const HEIGHT = 50;
const SPACING = 70;
const YPOS = 100;


export class Bed extends Phaser.GameObjects.Container {

    patient: Patient;
    protected sprite: Phaser.GameObjects.Sprite;
    private onOrganClick: (patient: Patient, organType: OrganType) => void;

    constructor(scene: Phaser.Scene, slot: number, onOrganClick: (patient: Patient, organType: OrganType) => void) {
        super(scene, WIDTH, HEIGHT);
        this.patient = null;
        this.onOrganClick = onOrganClick;
        this.x = 50 + slot * SPACING;
        this.y = YPOS;
        this.createSprite();
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'bed', 0);
        this.add(this.sprite);
        // let bubble = this.scene.add.image(0, -100, 'bubble');
        let bubble = this.scene.add.rectangle(0, -50, 50, 50, 0xff0000);
        this.add(bubble);
    }

    generatePatient(difficulty: number) {
        this.patient = new Patient(this.scene, this);
        this.patient.addOrganClickListeners(this.onOrganClick);
        this.sprite.setFrame(1);
    }

    hasPatient(): boolean {
        return this.patient !== null;
    }

}
