export const TOUR_DESTINATIONS={
 necros:{key:'track19',fallback:'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386',title:'NECROS',event:'Campaign event'},
 vitrum:{key:'track20',fallback:'track18',title:'VITRUM LITHOFYTER',event:'Open race / garage loadout'},
 collective:{key:'track21',title:'THE COLLECTIVE',event:'Open race / garage loadout'},
};
export function tourTrackKey(world,tracks){const d=TOUR_DESTINATIONS[world];return d&&(tracks[d.key]?d.key:tracks[d.fallback]?d.fallback:null);}
