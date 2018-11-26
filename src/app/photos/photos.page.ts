import { Component, OnInit } from '@angular/core';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {PhotosService} from './photos.service'
import {ToastController} from '@ionic/angular';
import { PhotoLibrary } from '@ionic-native/photo-library/ngx';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { File } from '@ionic-native/file/ngx';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.page.html',
  styleUrls: ['./photos.page.scss'],
})
export class PhotosPage implements OnInit {

  images=[];
  isAsc=true;

  constructor(private photosService: PhotosService,
              private camera: Camera,
              private photoLibrary: PhotoLibrary,
              private toastController: ToastController,
              private photoViewer: PhotoViewer,
              private file: File,
              private actionSheetController: ActionSheetController) { }

  async ngOnInit() {
    this.list();
  }

  async list(){
    try{
      const data = await this.photosService.list(this.isAsc);
      this.images=[];
      data.Contents.reverse().forEach(image => {
        this.images.push({key:image.Key, src:"http://barbacopolyresized.s3-website.eu-west-1.amazonaws.com/"+image.Key})
      });
    }catch(e){
      let toast = await this.toastController.create({
        message: "Error: "+e.message,
        duration: 2000
      });
      toast.present();
    }
  }

  async changeAscDesc(){
    this.isAsc = !this.isAsc;
    this.images.reverse();
  }

  async refresh(){
    this.list();
    this.isAsc=true;
  }

  async selectImage(id){
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona una opción:',
      buttons: [
        {text: "Abrir", icon:"image", handler:()=>{this.open(id)}},
        {text: "Descargar", icon:"cloud-download", handler:()=>{this.download(id)}},
        {text: "Comentar", icon:"contacts"/*, handler:()=>{this.comments(id)}*/}
      ]
    });
    await actionSheet.present();
  }

  async open(id){
    let re = /resized\-/gi;
    id = id.replace(re, "");
    this.photoViewer.show("http://barbacopoly.s3-website.eu-west-1.amazonaws.com/" +id, 'Barbacopoly', {share: true});
  }

  async download(id){
    try{
      let re = /resized\-/gi;
      id = id.replace(re, "");
      await this.photoLibrary.saveImage("http://barbacopoly.s3-website.eu-west-1.amazonaws.com/" +id, "Barbacopoly");
      let toast = await this.toastController.create({
        message: "Foto descargada",
        duration: 2000
      });
      toast.present();
    }catch(e){
      console.error(e);
      let toast = await this.toastController.create({
        message: "Error: "+e.message,
        duration: 2000
      });
      toast.present();
    }
  }

  takePicture() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: true,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(async(imageData) => {
      try{
        await this.photosService.postImage(imageData);
        let toast = await this.toastController.create({
          message: "Foto subida a Internet",
          duration: 2000
        });
        toast.present();
      }catch(e){
        console.error(e);
        let toast = await this.toastController.create({
          message: "La foto no se ha podido subir a Internet",
          duration: 2000
        });
        toast.present();
      }finally{
        this.list();
      }
    });
  }

  upload(){
    var _sef=this;
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: true,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(async(imageUrl) => {
      try{
        let name = imageUrl.split(/(\\|\/)/g).pop().split("?")[0];
        let folder = imageUrl.substring(0,imageUrl.lastIndexOf("/")+1);
        _sef.file.readAsArrayBuffer(folder, name).then(async function(bytes){
          await _sef.photosService.postImage(bytes);
          let toast = await _sef.toastController.create({
            message: "Foto subida a Internet",
            duration: 2000
          });
          toast.present();
        }).catch(async function(e){
          console.error(e);
          let toast = await _sef.toastController.create({
            message: "Error subiendo foto a Internet: "+e.message,
            duration: 2000
          });
          toast.present();
        });
      }catch(e){
        console.error(e);
        let toast = await _sef.toastController.create({
          message: "La foto no se ha podido subir a Internet",
          duration: 2000
        });
        toast.present();
      }finally{
        _sef.list();
      }
    });
  }
}