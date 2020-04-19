import 'phaser';
import { Bed } from './bed';
import { TrashCan } from './trashcan';
import { Doctor } from './doctor';
import { Patient } from './patient';
import { OrganType, Organ } from './organ';



export const FONT_FAMILY = 'akhbar';
export const DARK_COLOR = '#28221f';


export default class Level extends Phaser.Scene {

    currentDoc: Doctor
    currentBed: Bed
    trashcan: TrashCan

    constructor() {
        super('level');
        this.currentDoc = null
        this.currentBed = null
    }

    loadImage(name: string) {
        this.load.image(name, `assets/${name}.png`);
    }

    loadSpreadsheet(name: string, frameWidth: number, frameHeight: number) {
        this.load.spritesheet(name, `assets/${name}.png`, { frameWidth: frameWidth, frameHeight: frameHeight });
    }

    preload() {
        this.loadImage('organ_cranium');
        this.loadImage('organ_liver');
        this.loadImage('organ_nephro');
        this.loadImage('info_field');
        this.loadSpreadsheet('bed', 50, 50);
        this.loadSpreadsheet('doctor_frames', 50, 50);
        this.loadImage('organ_cranium');
        this.loadImage('organ_liver');
        this.loadImage('organ_nephro_left');
        this.loadImage('organ_nephro_right');
    }


    create() {
        for (let i = 0; i < 5; i++) {
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
            frames: [ { key: 'doctor_frames', frame: 0 } ],
            frameRate: 7,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_without',
            frames: [ { key: 'doctor_frames', frame: 1 }, { key: 'doctor_frames', frame: 0 }, { key: 'doctor_frames', frame: 2 }, { key: 'doctor_frames', frame: 0 } ],
            frameRate: 7,
            repeat: -1
        });
        this.anims.create({
            key: 'wait_with',
            frames: [ { key: 'doctor_frames', frame: 3 } ],
            frameRate: 7,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_with',
            frames: [ { key: 'doctor_frames', frame: 4 }, { key: 'doctor_frames', frame: 3 }, { key: 'doctor_frames', frame: 5 }, { key: 'doctor_frames', frame: 3 } ],
            frameRate: 7,
            repeat: -1
        });
    }

    onDoctorClick(doctor: Doctor) {
        this.currentDoc = doctor;
    }

    onOrganClick(patient: Patient, organ: Organ) {
        console.log(patient);
        
        if (this.currentDoc !== null) {
            if (this.currentDoc.isReadyToRemove()) {
                this.currentDoc.setRemoveTarget(patient, organ.getType());
            } else if (this.currentDoc.isReadyToRemove()) {
                this.currentDoc.setInsertTarget(patient);
            }
            this.currentDoc = null;
        }
    }

    onBedClick(bed: Bed) {
        if (this.currentDoc !== null) {
            if (this.currentDoc.isReadyToInsert() && bed.canBeInserted(this.currentDoc.organ)) {
                this.currentDoc.setInsertTarget(bed.patient);
            }
            this.currentDoc = null;
        }
    }

    onTrashcanClick() {
        if (this.currentDoc !== null && this.currentDoc.isReadyToInsert()) {
            this.currentDoc.setInsertTarget(this.trashcan);
            this.currentDoc = null;
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
