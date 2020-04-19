import 'phaser';
import { Patient } from './patient';
import { Organ } from './organ';
import { HOVER_OPACITY } from './global';


const WIDTH = 50;
const HEIGHT = 50;
const SPACING = 60;
const YPOS = 75;


export class Bed extends Phaser.GameObjects.Container {

    patient: Patient;
    protected sprite: Phaser.GameObjects.Sprite;
    protected infoBoard: Phaser.GameObjects.Image;
    readonly onOrganClick: (patient: Patient, organ: Organ) => void;

    constructor(scene: Phaser.Scene, slot: number, onOrganClick: (patient: Patient, organ: Organ) => void) {
        super(scene, WIDTH, HEIGHT);
        this.patient = null;
        this.onOrganClick = onOrganClick;
        this.x = 52 + slot * SPACING;
        this.y = YPOS;
        this.depth = this.y + this.height;
        this.createSprite();
        this.setInteractive();
        this.on('pointerover', () => this.sprite.alpha = this.infoBoard.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.sprite.alpha = this.infoBoard.alpha = 1);
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(5, 30, 'bed', 0);
        this.add(this.sprite);
        this.infoBoard = this.scene.add.image(0, -25, 'infoboard');
        this.add(this.infoBoard);
        this.setSize(50, 112);
    }

    canBeInserted(organ: Organ): boolean {
        if (this.patient === null) {
            return false;
        }
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
