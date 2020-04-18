import 'phaser';
import { Bed } from './bed';
import { TrashCan } from './trashcan';
import { Doctor } from './doctor';
import { Patient } from './patient';
import { OrganType } from './organ';


export default class Level extends Phaser.Scene {

    currentDoc: Doctor
    currentBed: Bed
    trashcan: TrashCan

    constructor() {
        super('level');
        this.currentDoc = null
        this.currentBed = null
    }

    preload() {
        this.load.spritesheet('bed', 'assets/bed.png', { frameWidth: 50, frameHeight: 50 });
    }

    create() {
        for (let i = 0; i < 5; i++) {
            let bed = new Bed(this, i, this.onOrganClick.bind(this));
            this.add.existing(bed);
            bed.generatePatient(0);
        }
        this.trashcan = new TrashCan(this);
        this.add.existing(this.trashcan);
        this.trashcan.on('pointerdown', this.onTrashcanClick.bind(this));
    }

    onDoctorClick(doctor: Doctor) {
        this.currentDoc = doctor
    }

    onOrganClick(patient: Patient, organType: OrganType) {
        if (this.currentDoc != null) {
            if (organType != null && this.currentDoc.organ == null) {
                this.currentDoc.setTarget(patient);
                this.currentDoc.setTask('remove', organType);
            } else if (organType == null && this.currentDoc.organ != null) {
                this.currentDoc.setTarget(patient);
                this.currentDoc.setTask('insert', organType)
            }
            this.currentDoc = null
        }
    }

    onTrashcanClick() {
        if (this.currentDoc != null) {
            this.currentDoc.setTarget(this.trashcan);
        }
    }

}


const config = {
    type: Phaser.AUTO,
    // backgroundColor: '#125555',
    width: 400,
    height: 250,
    pixelArt: true,
    zoom: 3,
    scene: Level
};

const game = new Phaser.Game(config);
