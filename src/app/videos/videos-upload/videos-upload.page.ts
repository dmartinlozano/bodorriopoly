import { Component, OnInit, NgZone } from '@angular/core';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { VideosService } from '../videos.service';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { NativeStorageService}  from '../../app.native.storage.service';

export enum ProgressUpload{
  Wait = 0,
  Uploading,
  Uploaded
}

export class FileUpload{
  file: FileEntry;
  state: ProgressUpload;
  progress: Number;
  error: Error;
}

@Component({
  selector: 'videos-upload',
  templateUrl: './videos-upload.page.html',
  styleUrls: ['./videos-upload.page.scss'],
})
export class VideosUploadPage implements OnInit {
  videos :FileUpload[]=[];
  subscriptionVideoToUpload: any;
  subscriptionVideoUploaded: any;
  subscriptionVideoProgress: any;

  constructor(private videosService: VideosService,
              private localNotifications: LocalNotifications,
              private nativeStorageService: NativeStorageService,
              private file: File,
              private ngZone: NgZone) { }

  async findAndReplace(video: FileUpload, videos: FileUpload[]){
    let foundIndex = videos.findIndex(v => v.file.fullPath === video.file.fullPath);
    videos[foundIndex] = video;
    await this.nativeStorageService.setItem("videos", videos);
  }

  async ngOnInit() {
    var _self = this;
    try{
      this.videos = await this.nativeStorageService.getItem("videos");
      this.videos.forEach(v => {
          if (v.state !== 3){
            v.error = null;
            v.state = 0;
            v.progress = 0;
          }
      });
    }catch(e){
      this.videos =[];
    }

    this.subscriptionVideoToUpload = this.videosService.getFileUploading().subscribe( async function(fullPath: string){
      let folder = fullPath.substring(0, fullPath.lastIndexOf("/")+1);
      let folderEntry = await _self.file.resolveDirectoryUrl(folder);
      let fileName = await _self.file.resolveLocalFilesystemUrl(fullPath);
      let fileEntry = await _self.file.getFile(folderEntry, fileName.name, {create:false})
      _self.videos.unshift({file: fileEntry, state: ProgressUpload.Wait, error: null, progress: 0});
      await _self.nativeStorageService.setItem("videos", _self.videos);
    });
    this.subscriptionVideoProgress = this.videosService.getFileUploadProgress().subscribe( async function(video: FileUpload){
      _self.ngZone.run(() => {
        _self.findAndReplace(video, _self.videos);
      });
    });
    this.subscriptionVideoUploaded = this.videosService.getFileUploaded().subscribe( async function(video: FileUpload){

      if (video.state === 3){
        _self.localNotifications.schedule({
          title: 'Barbacopoly',
          text: 'Video subido. En breve lo publicaremos.',
          vibrate: true,
          icon: 'warning',
        });
      }

      if (video.error !== null){
        _self.localNotifications.schedule({
          title: 'Barbacopoly',
          text: video.error.message,
          vibrate: true,
          icon: 'warning',
        });
      }
      _self.ngZone.run(() => {
        _self.findAndReplace(video, _self.videos);
      });
    });
  }

  async deleteAll(){
    this.videos = [];
    await this.nativeStorageService.setItem("videos", this.videos);
  }
  
  initUpload(video: FileUpload){
    this.videosService.postVideo(video);
  }

}
