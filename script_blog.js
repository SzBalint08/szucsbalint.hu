function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

fetch('blog.json')
  .then(response => response.json())
  .then(data => {
    const lang = document.documentElement.lang || 'hu';
    const container = document.getElementById('blogContainer');

    data.posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'blogPost';

      const dateDiv = document.createElement('div');
      dateDiv.className = 'postDate';
      dateDiv.textContent = post.date;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'postContent';
      contentDiv.textContent = post.content[lang];

      postDiv.appendChild(dateDiv);
      postDiv.appendChild(contentDiv);
      container.appendChild(postDiv);
    });
  })
  .catch(err => console.error('Hiba a blog betöltésekor:', err));
