var port = 8888;

// import React from 'react';
// import { render } from 'react-dom';

/* This array is just for testing purposes.  You will need to 
   get the real image data using an AJAX query. */

// const photos = [
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/A%20Torre%20Manuelina.jpg", width: 574, height: 381 },
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/Uluru%20sunset1141.jpg", width: 500 , height: 334 },
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/Sejong tomb 1.jpg", width: 574, height: 430},
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/Serra%20da%20Capivara%20-%20Painting%207.JPG", width: 574, height: 430},
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/Royal%20Palace%2c%20Rabat.jpg", width: 574, height: 410},
// {src: "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/Red%20pencil%20urchin%20-%20Papahnaumokukea.jpg", width: 574 , height: 382 }
// ];


// /Users/test/Library/Messages/Attachments/74/04/699533C7-A4BE-43E4-A7D2-34FA10C8ACDC/photoq/public
const TagButton = ({ name, handleTagDeleteButtonPress }) => {
	return (
		<div className="tag">
			<span>{name}</span>
			<button onClick={e => handleTagDeleteButtonPress(e, name)}>x</button>
		</div>
	);
}


class TagInput extends React.Component {

	constructor(props) {
		super(props);
		this.state = { value: '' };
	}

	render() {

		const { value } = this.state;
		const { createNewTag } = this.props;

		return (
			<div className="tagInput">
				<input type="text" onChange={e => this.setState({ value: e.target.value })} value={value} />
				<button onClick={e => createNewTag(e, value)}>+</button>
			</div>
		);
	}
}



// A react component for controls on an image tile
class TileControl extends React.Component {



	render() {
		const { photo, handleTagDeleteButtonPress, createNewTag } = this.props;
		const { selected } = photo;
		const allTags = photo.tags.split(',');

		return (
			<div className={selected ? 'selectedControls' : 'normalControls'} onClick={e => e.stopPropagation()}>
				{
					selected && allTags
						.map((tag, i) => (
							<TagButton
								key={i}
								name={tag}
								transparent={i === allTags.length - 1}
								handleTagDeleteButtonPress={handleTagDeleteButtonPress}
							/>
						))
				}


				{selected && <TagInput createNewTag={createNewTag} />}
			</div>
		);
	}
};




class ImageTile extends React.Component {

	render() {
		const _photo = this.props.photo;
		const { handleTagDeleteButtonPress, onClick, createNewTag } = this.props;

		return (
			<div
				className="tile"
				style={{ display: 'inline-block', margin: this.props.margin, width: _photo.width, position: 'relative' }}
				onClick={e => onClick(e, { index: this.props.index, photo: _photo })}
			>
				<div style={{ position: 'absolute', top: 0, left: 0 }}>
					<TileControl
						photo={_photo}
						createNewTag={(e, value) => createNewTag(e, value, { index: this.props.index, photo: _photo })}
						handleTagDeleteButtonPress={(e, name) => handleTagDeleteButtonPress(e, name, { index: this.props.index, photo: _photo })}
					/>
				</div>

				<img
					src={_photo.src}
					width={_photo.width}
					height={_photo.height}
					className={this.props.selected ? 'selected' : 'normal'}
				/>
			</div>
		);
	}
}


const Guide = ({ tags }) => (
	<div>
		You searched for {tags.map(((tag, i) => <TagButton key={i} name={tag} />))}
	</div>
);

const RelatedTags = ({ tagCollection, handleRelatedTagClick }) => (
	<div>
		Related Tags { tagCollection.map(tag => <div onClick={e => handleRelatedTagClick(e, tag)} className="relatedTag">{tag}</div>)}
	</div>
)


// The react component for the whole image gallery
// Most of the code for this is in the included library
class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { photos: [], tags: [], relatedTags: [] };
		this.selectedTile = this.selectedTile.bind(this);
		this.receiveImages = this.receiveImages.bind(this);
		this.createNewTag = this.createNewTag.bind(this);
		this.handleTagDeleteButtonPress = this.handleTagDeleteButtonPress.bind(this);
		this.autoCompletion = this.autoCompletion.bind(this);
		this.handleRelatedTagClick = this.handleRelatedTagClick.bind(this);
		this.autoCompletion = this.autoCompletion.bind(this);
		this.receiveAuto = this.receiveAuto.bind(this);
		window.autoCompletion = this.autoCompletion;
	}


	componentWillMount() {
		window.photoByNumber = () => {
			// Called when the user pushes the "submit" button 
			let num = document.getElementById("num").value;
			let allTags = num.split(",");
			let tagList = allTags.map(tag => tag.trim().replace(/\s/g, "%20"))
				.join('+');

			var oReq = new XMLHttpRequest();
			this.oReq = oReq;

			let url = `http://localhost:${port}/query?keyList=${tagList}`;
			this.oReq.open("GET", url);
			this.oReq.addEventListener("load", this.receiveImages);
			this.oReq.send();

			this.setState({ tags: allTags });
		}

	}

	receiveImages() {
		
		var allPhotos = JSON.parse(this.oReq.responseText);

		allPhotos.forEach(currentPhoto => {
			currentPhoto.src = currentPhoto.fileName;
		});

		this.setState({ photos: allPhotos });
		// allPhotos = "";
	}

	selectedTile(event, obj) {
		console.log("image clicked", obj);

		let { photos } = this.state;
		photos[obj.index].selected = !photos[obj.index].selected;
		this.setState({ photos: [...photos] });
	}

	handleTagDeleteButtonPress(e, name, photo) {
		console.log('deleting tag', name);
		var idElement = photo.idNum;
		var allTags = photo.photo.tags;
		allTags = allTags.split(",");
		var removeIndex = allTags.indexOf(name);
		allTags.splice(removeIndex, 1);
		var queryString = "";
		for(let i = 0; i < allTags.length; i++){
			queryString = queryString + allTags[i];
			if(i < allTags.length - 1){
				queryString = queryString + "+";
			}
		}
		queryString.trim();
		let url = `http://localhost:${port}/query?delete/${photo.photo.idNum}/${queryString}`;
		url = url.trim().replace(/\s/g, "%20");
		const oReq = new XMLHttpRequest();
		this.oReq = oReq;
		oReq.open("POST", url);
		oReq.send();


		// let { photos } = this.state;
		// let { index } = photo;

		// const tagsArray = photos[index].tags.split(',');
		// tagsArray.push(newTagValue);
		// const tagsString = tagsArray.join(',');





		let { photos } = this.state;
		let { index } = photo;

		const filteredOutTags = photos[index].tags.split(',').filter(tag => tag !== name);
		const filterOutTagToString = filteredOutTags.join(',');

		// let cmd = `http://localhost:${port}/query?delete/${photo.photo.idNum}/${newTags}`;
		// Haris send the request for deleted button here
		photos[index].tags = filterOutTagToString;
		this.setState({ photos: [...photos] });
	}

	
	autoCompletion() {
		var params = document.getElementById("num").value;
		if(params.length>=2){
			var url = `http://localhost:${port}/query?autocomplete/${params}`;
			const oReq = new XMLHttpRequest();
			this.autocompleteOreq = oReq;
			console.log(url);
			oReq.open("GET", url);
			oReq.addEventListener("load", this.receiveAuto);
			oReq.send();
		} else {
			this.setState({ relatedTags: [] });
		}
	}

	//WHAT WE SHOULD DO AFTER WE RECEIVE THE JSON RESPONSE FOR AUTOKEY
	receiveAuto(data){
		const relatedTags = JSON.parse(this.autocompleteOreq.response);
		this.setState({ relatedTags: relatedTags })
	};

	createNewTag(e, newTagValue, photo) {
		console.log('pushing tag', newTagValue);
		let newTags = photo.photo.tags;
		if (newTags.split(",").length >= 7 || newTags.split(",").includes(newTagValue)) {
			console.log("Number of tags is already over 7 or the element is already in the tags array");
		} else {
			newTags = newTags + "," + newTagValue;
			newTags = newTags.split(",");
			let unique_array = [];
			for(let i = 0; i < newTags.length; i++){
				if(unique_array.indexOf(newTags[i]) == -1){
					unique_array.push(newTags[i])
				}
			}
			newTags = unique_array;
			newTags = newTags.toString();
			console.log(newTags);
			let url = `http://localhost:${port}/query?add/${photo.photo.idNum}/${newTags}`;
			console.log(url);
			const oReq = new XMLHttpRequest();
			this.oReq = oReq;
			oReq.open("POST", url);
			oReq.send();
			let { photos } = this.state;
			let { index } = photo;

			const tagsArray = photos[index].tags.split(',');
			tagsArray.push(newTagValue);
			const tagsString = tagsArray.join(',');

			// Haris send the request for new tags here
			photos[index].tags = tagsString;
			this.setState({ photos: [...photos] });
		}
	}

	handleRelatedTagClick(e, tag) {
		document.getElementById("num").value = tag;
	}

	

	render() {

		const { props } = this;
		const { photos, tags, relatedTags } = this.state;

		if (photos.length < 1) {
			return (
				<div>
					<div>Nothing Has Been Searched Yet!</div>
					{ 
						relatedTags.length > 0 ? 
							<RelatedTags
								tagCollection={relatedTags}
								handleRelatedTagClick={this.handleRelatedTagClick}
							/> 
						: null
					}
				</div>
			)
		}

		return (
			<div>
				<div>
					{tags.length > 0 ? <Guide tags={tags} /> : null}
					
					{ 
						relatedTags.length > 0 ? 
							<RelatedTags
								tagCollection={relatedTags}
								handleRelatedTagClick={this.handleRelatedTagClick}
							/> 
						: null
					}

					<Gallery
						photos={this.state.photos}
						onClick={this.selectedTile}
						ImageComponent={props => <ImageTile {...props} createNewTag={this.createNewTag} handleTagDeleteButtonPress={this.handleTagDeleteButtonPress} />}
					/>
				</div>
			</div>
		)
	};
}


ReactDOM.render(<App />, document.getElementById("container"));
