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
        this.loadImage('organ_cranium')
        this.loadImage('organ_liver')
        this.loadImage('organ_nephro')
    }


    create() {
        for (let i = 0; i < 5; i++) {
            let bed = new Bed(this, i, this.onOrganClick.bind(this));
            this.add.existing(bed);
            bed.generatePatient(0);
        }
        let doc = new Doctor(this);
        doc.on('pointerdown', this.onDoctorClick.bind(this));
        this.add.existing(doc);
        this.trashcan = new TrashCan(this);
        this.add.existing(this.trashcan);
        this.trashcan.on('pointerdown', this.onTrashcanClick.bind(this));
        this.add.text(40, 150, ['Lorem ipsum dolor sit amet.', 'Blabliblubb und Zötteli dra'], { fontFamily: FONT_FAMILY });

        this.anims.create({
            key: 'walk_with',
            frames: this.anims.generateFrameNumbers('doctor_frames', { start: 3, end: 5 }),
            frameRate: 10,
            repeat: 20
        });

        this.anims.create({
            key: 'walk_without',
            frames: this.anims.generateFrameNumbers('doctor_frames', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: 20
        });
    }

    onDoctorClick(doctor: Doctor) {
        console.log("clicked a doc")
        this.currentDoc = doctor
    }

    onOrganClick(patient: Patient, organ: Organ) {
        if (this.currentDoc !== null) {
            if (organ !== null && this.currentDoc.organ === null) {
                console.log(this.currentDoc);
                
                this.currentDoc.setTarget(patient);
                this.currentDoc.setTask('remove', organ.getType());
            } else if (organ === null && this.currentDoc.organ !== null) {
                this.currentDoc.setTarget(patient);
                this.currentDoc.setTask('insert', organ.getType());
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
