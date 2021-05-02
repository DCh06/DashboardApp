import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations: [
    trigger('itemAnim', [
      //ENTRY ANIMATION
      transition('void => *', [
        //Initial states
        style({
          height: 0,
          opacity: 0,
          transform: 'scale(0.85)',
          'margin-bottom': 0,

          //we have to 'expand' out padding properties
          paddingTop: 0,
          paddingBottom: 0,
          paddingRight: 0,
          paddingLeft: 0,
        }),
        //we first want to animate the spacing which includes height and margin
        animate('50ms', style({
          height: '*',
          'margin-bottom': '*',
          paddingTop: '*',
          paddingBottom: '*',
          paddingRight: '*',
          paddingLeft: '*',
        })),
        animate(100)
      ]),
      transition('* => void', [
        animate(50, style({
          transform: 'scale(1.05)'
        })),
        //then scale out to normal when beggining to fade out
        animate(50, style({
          transform: 'scale(1)',
          opacity: 0.75,
        })),
        // scale down and fade out completely
        animate('120ms ease-out', style({
          transform: 'scale(0.68)',
          opacity: 0,
        })),
        // then animate the spacing with height and margin and padding
        animate('150ms ease-out', style({
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingRight: 0,
          paddingLeft: 0,
          'margin-bottom': '0'
        }))
      ])
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({
            opacity: 0,
            height: 0
          }),
          stagger(100, [
            animate('200ms ease')
          ])
        ], {
          optional: true
        })
      ])
    ])
  ]
})
export class NotesListComponent implements OnInit {

  notes: Note[] = new Array<Note>();
  filteredNotes: Note[] = new Array<Note>();

  @ViewChild('filterInput') filterInputElementRef: ElementRef<HTMLInputElement>; 


  constructor(private notesService: NotesService) { }

  ngOnInit(): void {
    this.notes = this.notesService.getAll();
    this.filteredNotes = [...this.notes];
  }

  deleteNote(note: Note) {
    let id = this.notesService.getId(note);
    this.notesService.delete(id);
    this.filter(this.filterInputElementRef.nativeElement.value)
  }

  getNoteUrl(note: Note){
    return this.notesService.getId(note);
  }

  filter(query: string) {
    query = query.toLowerCase().trim();

    let allResults: Note[] = new Array<Note>();
    //split up the search query into individual words on spaces
    let terms: string[] = query.split(' ');

    // remove duplicates search terms
    terms = this.removeDuplicates(terms);

    // compile all relevant results into allResults array
    terms.forEach(term => {
      let results: Note[] = this.findRelevantNotes(term);
      allResults = [...allResults, ...results];
    });

    // all results will include duplicate notes
    // because particular note  can be the result of many search terms 
    // but we dont want to show the same note multiple times on the UI
    // so we first must remove the duplicates
    let uniqueResults = this.removeDuplicates(allResults);
    this.filteredNotes = uniqueResults;

    //sort by relevancy
    this.sortByRelevancy(allResults);
  }

  findRelevantNotes(query: string): Array<Note> {
    query = query.toLowerCase().trim();
    let relevantNotes = this.notes.filter(note => {
      if (note.body?.toLowerCase().includes(query) || note.title.toLocaleLowerCase().includes(query)) {
        return true;
      }
      return false;
    })
    return relevantNotes;
  }

  removeDuplicates(arr: Array<any>): Array<any> {
    let uniqueResults: Set<any> = new Set<any>(arr);

    return Array.from(uniqueResults);
  }


  sortByRelevancy(searchResults: Note[]) {
    // relevancy based on number of times it appear in search result

    let noteCountObj: Object = {};// format key: value => NoteId: number (note object id : count)

    searchResults.forEach(note => {
      let noteId = this.notesService.getId(note);

      if (noteCountObj[noteId]) {
        noteCountObj[noteId] += 1;
      }
      else {
        noteCountObj[noteId] = 1;
      }

    })

    this.filteredNotes = this.filteredNotes.sort((a: Note, b: Note) => {
      let aId = this.notesService.getId(a);
      let bId = this.notesService.getId(b);

      let aCount = noteCountObj[aId];
      let bCount = noteCountObj[bId];

      return bCount - aCount;
    });
  }

}
