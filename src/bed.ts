import 'phaser';
import { Patient } from './patient';
import { Organ, ORGAN_TYPES } from './organ';
import { HOVER_OPACITY } from './global';


const WIDTH = 50;
const HEIGHT = 50;
const SPACING = 60;
const YPOS = 65;


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
        this.depth = this.y + this.height / 2;
        this.createSprite();
        this.setInteractive();
        this.on('pointerover', () => this.sprite.alpha = this.infoBoard.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.sprite.alpha = this.infoBoard.alpha = 1);
        this.scene.events.on('update', this.updatePatient.bind(this));
    }

    private updatePatient(time: number, delta: number) {
        if (this.patient !== null) {
            this.patient.update(time, delta);
        }
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(5, 30, 'bed', 0);
        this.add(this.sprite);
        this.infoBoard = this.scene.add.image(0, -25, 'infoboard');
        this.infoBoard.visible = false;
        this.add(this.infoBoard);
        this.setSize(50, 112);
    }

    onPatientDied() {
        let oldPatient = this.patient;
        let oldSprite = this.sprite;
        let oldInfoBoard = this.infoBoard;
        this.createSprite();
        this.sprite.alpha = 0;
        this.scene.tweens.add({
            targets: oldSprite,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                oldPatient.destroy();
                oldSprite.destroy();
                oldInfoBoard.destroy();
            }
        });
        let ghost = this.scene.add.image(this.x, this.y + 15, 'ghost');
        ghost.depth = 1000;
        this.scene.tweens.add({
            targets: ghost,
            y: '-=50',
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                ghost.destroy();
            }
        });
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 1,
            duration: 1000
        });
        this.patient = null;
    }

    canBeInserted(organ: Organ): boolean {
        if (this.patient === null) {
            return false;
        }
        return this.patient.organs[organ.getType()] === null;
    }

    generatePatient(missingOrganProb: number) {
        this.patient = new Patient(this.scene, this, missingOrganProb);
        this.patient.addOrganClickListeners();
        this.sprite.setFrame(1);
        this.infoBoard.visible = true;
    }

    hasPatient(): boolean {
        return this.patient !== null;
    }

}
