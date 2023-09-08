module sui_place::board {
    use std::vector;

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext, sender};
    use sui::transfer::transfer;
    use sui::dynamic_object_field::{Self};

    const EIncorrectAdminCap: u64 = 0;
    const EInvalidCoord: u64 = 1;

    struct BOARD has drop {}
    
    struct Place has key, store {
        id: UID,
        paused: bool
    }

    struct AdminCap has key, store {
        id: UID,
        place: address
    }

    struct Quadrant has key, store {
        id: UID,
        board: vector<vector<u8>>
    }

    fun make_row(length: u64): vector<u8> {
        let row = vector::empty<u8>();
        let i = 0;
        while (i < length) {
            vector::push_back(&mut row, 0);
            i = i + 1;
        };
        row
    }

    fun make_board(length: u64): vector<vector<u8>> {
        let col = vector::empty<vector<u8>>();
        let i = 0;
        while (i < length) {
            vector::push_back(&mut col, make_row(length));
            i = i + 1;
        };
        col
    }

    fun init(otw: BOARD, ctx: &mut TxContext) {
        let sender_addr = sender(ctx);
        
        let place_id = object::new(ctx);
        let place_addr = object::uid_to_address(&place_id);
        let new_place = Place {
            id: place_id,
            paused: false
        };

        dynamic_object_field::add(&mut new_place.id, 0u8, Quadrant {
            id: object::new(ctx),
            board: make_board(256)
        });
        dynamic_object_field::add(&mut new_place.id, 1u8, Quadrant {
            id: object::new(ctx),
            board: make_board(256)
        });
        dynamic_object_field::add(&mut new_place.id, 2u8, Quadrant {
            id: object::new(ctx),
            board: make_board(256)
        });
        dynamic_object_field::add(&mut new_place.id, 3u8, Quadrant {
            id: object::new(ctx),
            board: make_board(256)
        });

        let pause_cap = AdminCap {
            id: object::new(ctx),
            place: place_addr
        };

        transfer(new_place, sender_addr);
        transfer(pause_cap, sender_addr);
    }

    fun get_quadrant_id(x: u64, y: u64): u8 {
        if (x < 256) {
            if (y < 256) { 0 } else { 2 }
        } else {
            if (y < 256) { 1 } else { 3 }
        }
    }

    public fun set_pixel_at(place: &mut Place, x: u64, y: u64, new_pixel: u8) {
        assert!(x < 512 && y < 512, EInvalidCoord);
        let quadrant = dynamic_object_field::borrow_mut<u8, Quadrant>(&mut place.id, get_quadrant_id(x, y));
        let pixel = vector::borrow_mut(vector::borrow_mut(&mut quadrant.board, x % 256), y % 256);
        *pixel = new_pixel;
    }

    public fun toggle_pause(place: &mut Place, cap: &AdminCap) {
        assert!(object::uid_to_address(&place.id) == cap.place, EIncorrectAdminCap);
        place.paused = !place.paused;
    }
}