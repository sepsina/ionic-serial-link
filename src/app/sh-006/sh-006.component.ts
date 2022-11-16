import { Component, OnInit, NgZone, OnDestroy, ApplicationRef } from '@angular/core';
import { SerialService } from '../serial.service';
import { EventsService } from '../events.service';
import { GlobalsService } from '../globals.service';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sh-006',
    templateUrl: './sh-006.component.html',
    styleUrls: ['./sh-006.component.scss'],
})
export class SH_006_Component implements OnInit, OnDestroy {

    minInt = 5;
    maxInt = 30;

    rangeMin = 780;
    rangeMax = 1000;
    rangeValues: number[];
    lblRange = '';
    lblSoilHum = '';

    shVal: number = 0;

    shFlag = false;
    batVoltFlag = false;

    repIntFormCtrl: FormControl;
    subscription = new Subscription();

    constructor(private serial: SerialService,
                private events: EventsService,
                private globals: GlobalsService,
                private ngZone: NgZone,
                private appRef: ApplicationRef) {
        //---
        this.rangeValues = [this.rangeMin, this.rangeMax];
        this.setLabel();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngOnInit(): void {

        this.events.subscribe('rdNodeDataRsp', (msg: Uint8Array)=>{
            let buf = msg.buffer;
            let data = new DataView(buf);
            let idx = 0;

            let partNum = data.getUint32(idx, this.globals.LE);
            idx += 4;
            if(partNum == this.globals.SH_006) {
                this.ngZone.run(()=>{
                    this.shFlag = !!data.getUint8(idx++);
                    this.batVoltFlag = !!data.getUint8(idx++);
                    this.repIntFormCtrl.setValue(data.getUint8(idx++));
                    this.rangeValues[0] = data.getUint16(idx, this.globals.LE);
                    idx += 2;
                    this.rangeValues[1] = data.getUint16(idx, this.globals.LE);
                    idx += 2;
                    this.rangeValues = [...this.rangeValues];
                    this.setLabel();
                });
            }
        });
        this.events.subscribe('rdNodeData_0', ()=>{
            this.rdNodeData_0();
        });

        this.events.subscribe('sh_val', (sh: number)=>{
            this.shVal = sh;
            this.ngZone.run(()=>{
                this.lblSoilHum = `soil humidity: ${sh}`;
            });
        });

        this.repIntFormCtrl = new FormControl(
            this.minInt, [
                Validators.required,
                Validators.min(this.minInt),
                Validators.max(this.maxInt)
            ]
        );
        const repIntSubscription = this.repIntFormCtrl.valueChanges.subscribe((newInt)=>{
            this.repIntFormCtrl.markAsTouched();
            this.appRef.tick();
        });
        this.subscription.add(repIntSubscription);
    }

    /***********************************************************************************************
     * fn          rdNodeData_0
     *
     * brief
     *
     */
    rdNodeData_0() {

        this.ngZone.run(()=>{
            this.shFlag = !this.shFlag;
            this.batVoltFlag = !this.batVoltFlag;
            this.repIntFormCtrl.setValue(this.minInt);
        });

        setTimeout(()=>{
            this.serial.rdNodeData_0();
        }, 200);
    }

    /***********************************************************************************************
     * fn          wrNodeData_0
     *
     * brief
     *
     */
    wrNodeData_0() {

        let buf = new ArrayBuffer(12);
        let data = new DataView(buf);
        let idx = 0;

        data.setUint32(idx, this.globals.SH_006, this.globals.LE);
        idx += 4;
        data.setUint8(idx++, this.shFlag ? 1 : 0);
        data.setUint8(idx++, this.batVoltFlag ? 1 : 0);
        data.setUint8(idx++, this.repIntFormCtrl.value);
        data.setUint16(idx, this.rangeValues[0], this.globals.LE);
        idx += 2;
        data.setUint16(idx, this.rangeValues[1], this.globals.LE);
        idx += 2;

        this.serial.wrNodeData_0(buf);
    }

    /***********************************************************************************************
     * fn          repIntErr
     *
     * brief
     *
     */
    repIntErr() {
        if(this.repIntFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.repIntFormCtrl.hasError('min')) {
            return `report interval must be ${this.minInt} - ${this.maxInt}`;
        }
        if(this.repIntFormCtrl.hasError('max')) {
            return `report interval must be ${this.minInt} - ${this.maxInt}`;
        }
    }

    /***********************************************************************************************
     * fn          isInvalid
     *
     * brief
     *
     */
    isInvalid() {
        if(this.repIntFormCtrl.invalid){
            return true;
        }
        return false;
    }

    /***********************************************************************************************
     * fn          rhFlagChange
     *
     * brief
     *
     */
    shFlagChange(flag) {
        this.ngZone.run(()=>{
            this.shFlag = flag;
        });
    }

    /***********************************************************************************************
     * fn          batVoltFlagChange
     *
     * brief
     *
     */
     batVoltFlagChange(flag) {
        this.ngZone.run(()=>{
            this.batVoltFlag = flag;
        });
    }

    /***********************************************************************************************
     * fn          rangeChanged
     *
     * brief
     *
     */
    rangeChanged(e){
        this.rangeValues = [...e.values];
        this.setLabel();
    }

    /***********************************************************************************************
     * fn          setLabel
     *
     * brief
     *
     */
    setLabel(){
        this.ngZone.run(()=>{
            this.lblRange = `set range: ${this.rangeValues[0]} - ${this.rangeValues[1]}`;
        });
    }
}
