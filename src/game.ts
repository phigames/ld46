import 'phaser';
import { Bed } from './bed';
import { TrashCan } from './trashcan';
import { Doctor } from './doctor';
import { Patient } from './patient';
import { OrganType, Organ } from './organ';


export const FONT_FAMILY = 'akhbar';
export const DARK_COLOR = '#28221f';


export var updatesPaused = false;


export default class Level extends Phaser.Scene {

    currentDoc: Doctor;
    currentBed: Bed;
    trashcan: TrashCan;
    timeToSpawnDoctor: number;

    invalidSound: Phaser.Sound.BaseSound;
    selectSound: Phaser.Sound.BaseSound;

    constructor() {
        super('level');
        this.currentDoc = null;
        this.timeToSpawnDoctor = 2000;
    }

    loadImage(name: string) {
        this.load.image(name, `assets/${name}.png`);
    }

    loadSpreadsheet(name: string, frameWidth: number, frameHeight: number) {
        this.load.spritesheet(name, `assets/${name}.png`, { frameWidth: frameWidth, frameHeight: frameHeight });
    }

    loadAudio(name: string) {
        this.load.audio(name, `assets/${name}.ogg`);
    }

    preload() {
        this.loadImage('infoboard');
        this.loadImage('organ_cranium');
        this.loadImage('organ_liver');
        this.loadImage('organ_nephro');
        this.loadSpreadsheet('bed', 50, 50);
        this.loadSpreadsheet('doctor', 50, 50);
        this.loadAudio('invalid');
        this.loadAudio('select');
    }

    create() {
        for (let i = 0; i < 7; i++) {
            let bed = new Bed(this, i, this.onOrganClick.bind(this));
            this.add.existing(bed);
            bed.generatePatient(0);
            bed.on('pointerdown', () => this.onBedClick(bed));
        }
        let doc = new Doctor(this);
        doc.on('pointerdown', () => this.onDoctorClick(doc));
        this.add.existing(doc);
        this.trashcan = new TrashCan(this);
        this.add.existing(this.trashcan);
        this.trashcan.on('pointerdown', this.onTrashcanClick.bind(this));

        this.anims.create({
            key: 'wait_without',
            frames: [ { key: 'doctor', frame: 0 } ],
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_without',
            frames: this.anims.generateFrameNumbers('doctor', { start: 0, end: 11 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'wait_with',
            frames: [ { key: 'doctor', frame: 12 } ],
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_with',
            frames: this.anims.generateFrameNumbers('doctor', { start: 12, end: 23 }),
            frameRate: 20,
            repeat: -1
        });

        this.invalidSound = this.sound.add('invalid');
        this.selectSound = this.sound.add('select');
    }

    popup(message: string) {
        updatesPaused = true;
        let popup = this.add.rectangle(100, 100, 200, 100);
        console.log(message);
        popup.on('click', () => {
            updatesPaused = false;
            popup.off('click');
        });
    }

    onDoctorClick(doctor: Doctor) {
        if (updatesPaused) {
            return;
        }
        if (doctor.isReadyToInsert() || doctor.isReadyToRemove()) {
            if (this.currentDoc !== null) {
                this.currentDoc.setSelected(false);
            }
            this.currentDoc = doctor;
            this.currentDoc.setSelected(true);
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
    }

    onOrganClick(patient: Patient, organ: Organ) {
        if (updatesPaused) {
            return;
        }
        if (this.currentDoc !== null) {
            if (this.currentDoc.isReadyToRemove()) {
                this.currentDoc.setRemoveTarget(patient, organ.getType());
            } else if (this.currentDoc.isReadyToRemove()) {
                this.currentDoc.setInsertTarget(patient);
            }
            this.currentDoc.setSelected(false);
            this.currentDoc = null;
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
    }

    onBedClick(bed: Bed) {
        if (updatesPaused) {
            return;
        }
        if (this.currentDoc !== null && this.currentDoc.isReadyToInsert() && bed.canBeInserted(this.currentDoc.organ)) {
            this.currentDoc.setInsertTarget(bed.patient);
            this.currentDoc.setSelected(false);
            this.currentDoc = null;
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
    }

    onTrashcanClick() {
        if (updatesPaused) {
            return;
        }
        if (this.currentDoc !== null && this.currentDoc.isReadyToInsert()) {
            this.currentDoc.setInsertTarget(this.trashcan);
            this.currentDoc.setSelected(false);
            this.currentDoc = null;
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
    }

}


const config = {
    type: Phaser.AUTO,
    // backgroundColor: '#125555',
    width: 464,
    height: 261,
    pixelArt: true,
    zoom: 3,
    scene: Level
};

const game = new Phaser.Game(config);
