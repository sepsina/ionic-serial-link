import { Component, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { GlobalsService } from './globals.service';
import { EventsService } from './events.service';
import { SerialService, rdKeys_t } from './serial.service';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { HTU21D_005_Component } from './htu21d-005/htu21d-005.component';
import { SH_006_Component } from './sh-006/sh-006.component';
//import { BME280_007_Component } from './bme280-007/bme280-007.component';
import { SSR_009_Component } from './ssr-009/ssr-009.component';
import { Actuator_010_Component } from './actuator-010/actuator-010.component';
import { DBL_SW_008_Component } from './dbl-sw-008/dbl-sw-008.component';
import { ZB_Bridge_Component } from './zb-bridge/zb-bridge.component';
import { Subscription } from 'rxjs';

const USB_CMD_STATUS_OK = 0x00;
//const USB_CMD_STATUS_FAIL = 0x01;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

    @ViewChild('dynamic', {read: ViewContainerRef}) viewRef: ViewContainerRef;

    minId = 1;
    maxId = 0xFFFE;

    nwkKeyFormCtrl: FormControl;
    panIdFormCtrl: FormControl;
    subscription = new Subscription();

    logs: string[] = [];
    scrollFlag = true;

    partNum = 0;
    prevPartNum = -1;
    startFlag = true;

    constructor(public serial: SerialService,
                public globals: GlobalsService,
                private events: EventsService,
                //private cfr: ComponentFactoryResolver,
                private ngZone: NgZone) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnDestroy
     *
     * brief
     *
     */
    ngOnDestroy() {
        this.serial.closeComPort();
        this.subscription.unsubscribe();
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {

        this.nwkKeyFormCtrl = new FormControl(
            'link-key-1234567',
            [
                Validators.required,
                Validators.minLength(16),
                Validators.maxLength(16),
            ]
        )
        const nwkKeySubscription = this.nwkKeyFormCtrl.valueChanges.subscribe((key)=>{
            this.nwkKeyFormCtrl.markAsTouched();
        });
        this.subscription.add(nwkKeySubscription);

        this.panIdFormCtrl = new FormControl(
            this.minId,
            [
                Validators.required,
                Validators.min(this.minId),
                Validators.max(this.maxId),
            ]
        );
        const panIdSubscription = this.panIdFormCtrl.valueChanges.subscribe((newId)=>{
            this.panIdFormCtrl.markAsTouched();
        });
        this.subscription.add(panIdSubscription);

        this.events.subscribe('closePort', (msg)=>{
            if(msg == 'close'){
                this.prevPartNum = -1;
            }
        });

        this.events.subscribe('rdKeysRsp', (msg)=>{
            this.rdKeysMsg(msg);
        });

        window.onbeforeunload = ()=>{
            this.ngOnDestroy();
        };

        this.events.subscribe('logMsg', (msg: string)=>{
            while(this.logs.length >= 20) {
                this.logs.shift();
            }
            this.ngZone.run(()=>{
                this.logs.push(msg);
            });
            if(this.scrollFlag == true) {
                let logsDiv = document.getElementById('logList');
                logsDiv.scrollTop = logsDiv.scrollHeight;
            }
        });
        this.events.subscribe('readPartNumRsp', (msg: number)=>{
            this.partNum = msg;
            if(this.partNum != this.prevPartNum) {
                this.prevPartNum = this.partNum;
                this.viewRef.clear();
                switch(this.partNum) {
                    case this.globals.ZB_BRIDGE: {
                        //const factory = this.cfr.resolveComponentFactory(ZB_Bridge_Component);
                        this.viewRef.createComponent(ZB_Bridge_Component);
                        break;
                    }
                    case this.globals.HTU21D_005: {
                        //const factory = this.cfr.resolveComponentFactory(HTU21D_005_Component);
                        this.viewRef.createComponent(HTU21D_005_Component);
                        break;
                    }
                    case this.globals.SH_006: {
                        //const factory = this.cfr.resolveComponentFactory(SH_006_Component);
                        this.viewRef.createComponent(SH_006_Component);
                        break;
                    }
                    case this.globals.DBL_SW_008: {
                        //const factory = this.cfr.resolveComponentFactory(DBL_SW_008_Component);
                        this.viewRef.createComponent(DBL_SW_008_Component);
                        break;
                    }
                    case this.globals.ACTUATOR_010: {
                        //const factory = this.cfr.resolveComponentFactory(Actuator_010_Component);
                        this.viewRef.createComponent(Actuator_010_Component);
                        break;
                    }
                    case this.globals.SSR_009: {
                        //const factory = this.cfr.resolveComponentFactory(SSR_009_Component);
                        this.viewRef.createComponent(SSR_009_Component);
                        break;
                    }
                    default:
                        break;
                }
            }
            console.log(`part number: ${this.partNum}`);
            if(this.startFlag == true) {
                this.startFlag = false;
                setTimeout(()=>{
                    this.readKeys();
                }, 100);
                setTimeout(()=>{
                    this.events.publish('rdNodeData_0');
                }, 200);
            }
        });

    }

    /***********************************************************************************************
     * @fn          onResize
     *
     * @brief
     *
     */
     onResize(event){
        const rect = event.contentRect;
        console.log(`w: ${rect.width}, h: ${rect.height}`);
        /*
        if(rect.width > 520){
            setTimeout(()=>{
                this.ngZone.run(()=>{
                    const elByID = document.getElementById('app-frame');
                    elByID.style.maxWidth = '500px';
                });
            }, 1000);
        }
        */
    }

    /***********************************************************************************************
     * fn          autoScroll
     *
     * brief
     *
     */
    autoScrollChange(scroll) {
        console.log(scroll);
        this.scrollFlag = scroll;
        if(scroll == true) {
            let logsDiv = document.getElementById('logList');
            logsDiv.scrollTop = logsDiv.scrollHeight;
        }
    }
    /***********************************************************************************************
     * fn          readKeys
     *
     * brief
     *
     */
    readKeys() {
        this.ngZone.run(()=>{
            this.nwkKeyFormCtrl.setValue('****************');
        });
        setTimeout(()=>{
            this.serial.rdKeys();
        }, 500);
    }
    /***********************************************************************************************
     * fn          rdKeysMsg
     *
     * brief
     *
     */
    rdKeysMsg(msg: rdKeys_t) {
        if(msg.status == USB_CMD_STATUS_OK) {
            console.log(`msg: ${JSON.stringify(msg)}`);
            this.ngZone.run(()=>{
                this.nwkKeyFormCtrl.setValue(msg.nwkKey);
                this.panIdFormCtrl.setValue(msg.panId);
            });
        }
    }

    /***********************************************************************************************
     * fn          nwkKeyErr
     *
     * brief
     *
     */
    nwkKeyErr() {
        if(this.nwkKeyFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.nwkKeyFormCtrl.hasError('maxlength')) {
            return 'link key must have 16 chars';
        }
        if(this.nwkKeyFormCtrl.hasError('minlength')) {
            return 'link key must have 16 chars';
        }
    }

    /***********************************************************************************************
     * fn          panIdErr
     *
     * brief
     *
     */
    panIdErr() {

        if(this.panIdFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.panIdFormCtrl.hasError('min')) {
            return `rep interval must be ${this.minId} - ${this.maxId}`;
        }
        if(this.panIdFormCtrl.hasError('max')) {
            return `rep interval must be ${this.minId} - ${this.maxId}`;
        }
    }

    /***********************************************************************************************
     * fn          openSerial
     *
     * brief
     *
     */
    openSerial() {
        this.serial.openComPort();
    }

    /***********************************************************************************************
     * fn          closeSerial
     *
     * brief
     *
     */
    closeSerial() {
        this.serial.closeComPort();
        this.startFlag = true;
    }

    /***********************************************************************************************
     * fn          wrKeys
     *
     * brief
     *
     */
    wrKeys() {
        this.serial.wrKeys(this.nwkKeyFormCtrl.value,
                           this.panIdFormCtrl.value);
    }

    /***********************************************************************************************
     * fn          clearLogs
     *
     * brief
     *
     */
    clearLogs() {
        this.logs = [];
    }

    /***********************************************************************************************
     * fn          clearLogs
     *
     * brief
     *
     */
    isSecValid() {
        if(this.nwkKeyFormCtrl.invalid){
            return false;
        }
        if(this.panIdFormCtrl.invalid){
            return false;
        }
        return true;
    }
}
