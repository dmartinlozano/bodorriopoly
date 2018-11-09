import { Component, OnInit } from '@angular/core';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {PhotosService} from './photos.service'
import {Transfer, FileUploadOptions, TransferObject} from '@ionic-native/transfer';
import {ToastController, LoadingController} from '@ionic/angular';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.page.html',
  styleUrls: ['./photos.page.scss'],
})
export class PhotosPage implements OnInit {

  images=[];
  nextPageToken=null;
  isAsc=false;
  slice: number=30;

  constructor(private photosService: PhotosService,
              private camera: Camera) { }

  async ngOnInit() {
    this.list();
  }

  async list(){
    const items = await this.photosService.list(this.isAsc, this.nextPageToken);
    this.images = this.images.concat(items.items);
    this.nextPageToken = items.nextPageToken;
  }

  async changeOrder(){
    this.isAsc = !this.isAsc;
    this.nextPageToken = null;
    this.images=[];
    this.list();
  }
  
  async doInfinite(infiniteScroll) {
    await this.list();
    infiniteScroll.target.complete();
    if (this.nextPageToken === null) {
      infiniteScroll.target.disabled = true;
    }
  }

  takePicture() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      targetWidth: 1000,
      targetHeight: 1000,
      saveToPhotoAlbum: true,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(async(imageData) => {
      const result = await this.photosService.post(imageData);
      console.log(result);
      
     }, (err) => {
      // Handle error
     });
  }
}