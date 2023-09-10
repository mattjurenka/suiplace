module sui_place::board {
    use std::vector;

    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer::{transfer, share_object};
    use sui::dynamic_object_field::{Self};

    const EIncorrectAdminCap: u64 = 0;
    const EInvalidCoord: u64 = 1;
    const EPaused: u64 = 2;

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
        quadrant_id: u8,
        board: vector<vector<u32>>
    }

    fun make_row(length: u64): vector<u32> {
        let row = vector::empty<u32>();
        let i = 0;
        while (i < length) {
            vector::push_back(&mut row, 4_294_967_295);
            i = i + 1;
        };
        row
    }

    fun make_board(length: u64): vector<vector<u32>> {
        let col = vector::empty<vector<u32>>();
        let i = 0;
        while (i < length) {
            vector::push_back(&mut col, make_row(length));
            i = i + 1;
        };
        col
    }

    fun init(ctx: &mut TxContext) {
        let sender_addr = sender(ctx);
        
        let place_id = object::new(ctx);
        let place_addr = object::uid_to_address(&place_id);
        let place = Place {
            id: place_id,
            paused: false
        };

        let i = 0u8;
        while (i < 4) {
            dynamic_object_field::add(&mut place.id, i, Quadrant {
                id: object::new(ctx),
                quadrant_id: i,
                board: make_board(200)
            });
            i = i + 1;
        };

        let pause_cap = AdminCap {
            id: object::new(ctx),
            place: place_addr
        };

        share_object(place);
        transfer(pause_cap, sender_addr);
    }

    fun get_quadrant_id(x: u64, y: u64): u8 {
        if (x < 200) {
            if (y < 200) { 0 } else { 2 }
        } else {
            if (y < 200) { 1 } else { 3 }
        }
    }

    public fun set_pixel_at(place: &mut Place, x: u64, y: u64, new_pixel: u32) {
        assert!(!place.paused, EPaused);
        assert!(x < 400 && y < 400, EInvalidCoord);
        let quadrant = dynamic_object_field::borrow_mut<u8, Quadrant>(&mut place.id, get_quadrant_id(x, y));
        let pixel = vector::borrow_mut(vector::borrow_mut(&mut quadrant.board, x % 200), y % 200);
        *pixel = new_pixel;
    }

    public fun get_quadrants(place: &Place): vector<address> {
        let retval = vector::empty<address>();
        let i = 0;
        while (i < 4) {
            vector::push_back(
                &mut retval,
                object::uid_to_address(&dynamic_object_field::borrow<u8, Quadrant>(&place.id, i).id)
            );
            i = i + 1;
        };
        retval
    }

    public fun toggle_pause(place: &mut Place, cap: &AdminCap) {
        assert!(object::uid_to_address(&place.id) == cap.place, EIncorrectAdminCap);
        place.paused = !place.paused;
    }
}