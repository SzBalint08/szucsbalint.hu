function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

// Blog betöltése JSON-ból
fetch('blog.json')
  .then(response => response.json())
  .then(data => {
    // Az oldal nyelvének meghatározása
    const lang = document.documentElement.lang || 'hu';
    const blogPosts = data[lang];

    const container = document.getElementById('blogContainer');
    blogPosts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'blogPost';

      const dateDiv = document.createElement('div');
      dateDiv.className = 'postDate';
      dateDiv.textContent = post.date;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'postContent';
      contentDiv.textContent = post.content;

      postDiv.appendChild(dateDiv);
      postDiv.appendChild(contentDiv);
      container.appendChild(postDiv);
    });
  })
  .catch(err => console.error('Hiba a blog betöltésekor:', err));
