"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiMap = void 0;
class MultiMap extends Map {
    add(key, value) {
        let set = super.get(key);
        if (!set) {
            set = new Set();
            super.set(key, set);
        }
        set.add(value);
        return this;
    }
    remove(key, value) {
        let set = super.get(key);
        if (set) {
            set.delete(value);
            if (!set.size) {
                super.delete(key);
            }
        }
        return this;
    }
}
exports.MultiMap = MultiMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGktbWFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvbXVsdGktbWFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLE1BQWEsUUFBZSxTQUFRLEdBQWM7SUFFOUMsR0FBRyxDQUFDLEdBQU0sRUFBRSxLQUFRO1FBQ2hCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNOLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1lBQ25CLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCO1FBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBTSxFQUFFLEtBQVE7UUFDbkIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLEdBQUcsRUFBRTtZQUNMLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7Z0JBQ1gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNyQjtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBdEJELDRCQXNCQyIsInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGNsYXNzIE11bHRpTWFwPEssIFY+IGV4dGVuZHMgTWFwPEssIFNldDxWPj4ge1xuXG4gICAgYWRkKGtleTogSywgdmFsdWU6IFYpOiBNdWx0aU1hcDxLLCBWPiB7XG4gICAgICAgIGxldCBzZXQgPSBzdXBlci5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFzZXQpIHtcbiAgICAgICAgICAgIHNldCA9IG5ldyBTZXQ8Vj4oKTtcbiAgICAgICAgICAgIHN1cGVyLnNldChrZXksIHNldCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LmFkZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbW92ZShrZXk6IEssIHZhbHVlOiBWKTogTXVsdGlNYXA8SywgVj4ge1xuICAgICAgICBsZXQgc2V0ID0gc3VwZXIuZ2V0KGtleSk7XG4gICAgICAgIGlmIChzZXQpIHtcbiAgICAgICAgICAgIHNldC5kZWxldGUodmFsdWUpO1xuICAgICAgICAgICAgaWYgKCFzZXQuc2l6ZSkge1xuICAgICAgICAgICAgICAgIHN1cGVyLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiJdfQ==